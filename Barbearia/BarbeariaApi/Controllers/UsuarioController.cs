using System.Security.Claims;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Repositories;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuarioController(UsuarioRepository repository, CredenciaisService credenciais, ImagemService imagens) : ControllerBase
{
    /// <summary>Profissionais para o agendamento (público); com "servicos=4,5", somente os que realizam todos.</summary>
    [HttpGet("profissionais")]
    [AllowAnonymous]
    public async Task<IActionResult> Profissionais([FromQuery] string servicos = null)
    {
        var ids = (servicos ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(valor => int.TryParse(valor, out var id) ? id : 0).Where(id => id > 0);
        return Ok(await repository.ListarProfissionais(ids));
    }

    [HttpGet("barbeiros")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Listar() => Ok(await repository.ListarBarbeiros());

    [HttpPost("barbeiros")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Cadastrar(InCadastrarBarbeiro input)
    {
        // ConfirmarSenha é validada pelo modelo ([Compare]) e não é enviada ao banco.
        PessoaService.ValidarUsuario(input.NM_Usuario, input.NO_Telefone);
        if (input.DT_Nascimento > DateOnly.FromDateTime(DateTime.Today).AddYears(-14))
            throw new ArgumentException("Data de nascimento inválida.");

        input.NM_Usuario = input.NM_Usuario.Trim();
        input.NO_Telefone = PessoaService.NormalizarTelefone(input.NO_Telefone);
        input.CD_Inscricao_Nacional = Documento.NormalizarCpf(input.CD_Inscricao_Nacional);
        var barbeiro = await repository.CadastrarBarbeiro(input, credenciais.GerarHash(input.Senha));
        return StatusCode(StatusCodes.Status201Created, barbeiro);
    }

    [HttpPut("barbeiros/{id:int}/senha")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DefinirSenha(int id, InDefinirSenha input)
    {
        if (id <= 0)
            return BadRequest(new { message = "Barbeiro inválido." });

        return await repository.DefinirSenhaBarbeiro(id, credenciais.GerarHash(input.Senha))
            ? NoContent()
            : NotFound(new { message = "Barbeiro não encontrado." });
    }

    /// <summary>Foto exibida na escolha do profissional. Admin altera de qualquer profissional; Barbeiro, a própria.</summary>
    [HttpPost("{id:int}/foto")]
    [Authorize(Roles = "Admin,Barbeiro")]
    [RequestSizeLimit(5 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> Foto(int id, IFormFile imagem)
    {
        if (!PodeAlterar(id))
            return Forbid();

        var caminho = await imagens.Salvar(imagem, "profissionais", $"profissional-{id}");
        if (!await repository.AtualizarFoto(id, caminho))
        {
            imagens.Remover(caminho, "profissionais", "profissional-");
            return NotFound(new { message = "Profissional não encontrado." });
        }
        return Ok(new { ds_imagem = caminho });
    }

    /// <summary>Serviços ativos com a indicação dos que o profissional realiza.</summary>
    [HttpGet("{id:int}/servicos")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> Servicos(int id) =>
        PodeAlterar(id) ? Ok(await repository.Servicos(id)) : Forbid();

    [HttpPut("{id:int}/servicos")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> DefinirServicos(int id, InServicosProfissional input)
    {
        if (!PodeAlterar(id))
            return Forbid();

        if (input.ID_Servico.Any(servico => servico <= 0))
            throw new ArgumentException("Serviço inválido.");

        await repository.DefinirServicos(id, input.ID_Servico);
        return NoContent();
    }

    private bool PodeAlterar(int id) =>
        id > 0 && (User.IsInRole("Admin") || User.FindFirstValue(ClaimTypes.NameIdentifier) == id.ToString());
}
