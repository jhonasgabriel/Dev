using BarbeariaApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace BarbeariaApi.Services;

public sealed class CredenciaisService
{
    private readonly PasswordHasher<UsuarioAutenticacao> _hasher = new(
        Options.Create(new PasswordHasherOptions { IterationCount = 210_000 }));
    private readonly string _hashInexistente;

    public CredenciaisService()
    {
        _hashInexistente = _hasher.HashPassword(new UsuarioAutenticacao(), Guid.NewGuid().ToString());
    }

    public string GerarHash(string senha)
    {
        if (string.IsNullOrWhiteSpace(senha) || senha.Length is < 10 or > 128)
            throw new ArgumentException("Senha deve ter entre 10 e 128 caracteres.");

        return _hasher.HashPassword(new UsuarioAutenticacao(), senha);
    }

    public PasswordVerificationResult Verificar(UsuarioAutenticacao usuario, string senha)
    {
        // Executa a mesma verificação custosa mesmo para um nome inexistente.
        var hash = usuario?.DS_SenhaHash ?? _hashInexistente;
        PasswordVerificationResult resultado;
        try
        {
            resultado = _hasher.VerifyHashedPassword(usuario ?? new UsuarioAutenticacao(), hash, senha);
        }
        catch (FormatException)
        {
            return PasswordVerificationResult.Failed;
        }
        return usuario?.DS_SenhaHash == null ? PasswordVerificationResult.Failed : resultado;
    }
}
