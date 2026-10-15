using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BarbeariaApi.Models;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace BarbeariaApi.Services;

public class LoginService
{
    private readonly LoginRepository _loginRepository;
    private readonly IConfiguration _configuration;
    private readonly CredenciaisService _credenciais;

    public LoginService(LoginRepository loginRepository, IConfiguration configuration, CredenciaisService credenciais)
    {
        _loginRepository = loginRepository;
        _configuration = configuration;
        _credenciais = credenciais;
    }

    public async Task<OutLogin> Login(InLogin login)
    {
        if (string.IsNullOrWhiteSpace(login.NM_Usuario) || string.IsNullOrEmpty(login.Senha))
            return null;

        // A senha é conferida somente contra o hash da pessoa com o nome digitado: nome de outra pessoa
        // (ou digitado errado, com uma letra trocada) não encontra credencial e nunca valida a senha de terceiros.
        // Nome inexistente e senha incorreta têm a mesma resposta e o mesmo custo de verificação.
        var credencial = await _loginRepository.ObterCredencial(login.NM_Usuario.Trim());
        if (_credenciais.Verificar(credencial, login.Senha) == PasswordVerificationResult.Failed)
            return null;

        return new OutLogin
        {
            ID_Usuario = credencial.ID_Usuario,
            ID_Pessoa = credencial.ID_Pessoa,
            NM_Usuario = credencial.NM_Usuario,
            TP_Usuario = credencial.TP_Usuario,
            CD_Token = GerarToken(credencial)
        };
    }

    private string GerarToken(UsuarioAutenticacao usuario)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("A chave JWT não foi configurada.");
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.ID_Usuario.ToString()),
            new Claim("pessoa_id", usuario.ID_Pessoa.ToString()),
            new Claim("auth_method", "senha"),
            new Claim("credential", AssinaturaCredencial.Gerar(key, usuario.DS_SenhaHash)),
            new Claim(ClaimTypes.Name, usuario.NM_Usuario),
            new Claim(ClaimTypes.Role, usuario.TP_Usuario)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
