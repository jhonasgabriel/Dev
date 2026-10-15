using System.Security.Claims;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/pessoas")]
[Authorize]
public class PessoaController : ControllerBase
{
    private readonly PessoaService _pessoaService;

    public PessoaController(PessoaService pessoaService)
    {
        _pessoaService = pessoaService;
    }

    [HttpPost("cadastrar")]
    [AllowAnonymous]
    public async Task<IActionResult> Cadastrar([FromBody] InCadastrarPessoa param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var pessoa = await _pessoaService.Cadastrar(param);
            return StatusCode(StatusCodes.Status201Created, pessoa);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("obter-ou-cadastrar")]
    [AllowAnonymous]
    public async Task<IActionResult> ObterOuCadastrar([FromBody] InCadastrarPessoa param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var pessoa = await _pessoaService.ObterOuCadastrar(param);
        return Ok(pessoa);
    }

    [HttpPost("consultar")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> Consultar([FromBody] InConsultarPessoa param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // O barbeiro consulta somente os próprios clientes, independentemente do filtro enviado.
        if (!User.IsInRole("Admin"))
            param.ID_Barbeiro = UsuarioAtual();

        try
        {
            var pessoas = await _pessoaService.Consultar(param);
            return Ok(pessoas);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("atualizar/{id}")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] InAtualizarPessoa param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!await PodeAcessarPessoa(id))
            return Forbid();

        try
        {
            var updated = await _pessoaService.Atualizar(id, param);
            if (!updated)
                return NotFound();

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deletar(int id)
    {
        try
        {
            var deleted = await _pessoaService.Deletar(id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/historico")]
    public async Task<IActionResult> Historico(int id)
    {
        if (!await PodeAcessarPessoa(id))
            return Forbid();

        var list = await _pessoaService.Historico(id);
        return Ok(list);
    }

    [HttpGet("{id}/frequencia")]
    public async Task<IActionResult> Frequencia(int id)
    {
        if (!await PodeAcessarPessoa(id))
            return Forbid();

        var freq = await _pessoaService.Frequencia(id);
        if (freq == null)
            return NotFound();

        return Ok(freq);
    }

    [HttpPatch("{id}/ativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Ativar(int id) =>
        await _pessoaService.AlterarStatus(id, true) ? NoContent() : NotFound();

    [HttpPatch("{id}/inativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Inativar(int id) =>
        await _pessoaService.AlterarStatus(id, false) ? NoContent() : NotFound();

    // Admin acessa qualquer cadastro; o barbeiro, o próprio e os dos seus clientes.
    private async Task<bool> PodeAcessarPessoa(int id) =>
        User.IsInRole("Admin")
        || User.FindFirstValue("pessoa_id") == id.ToString()
        || (User.IsInRole("Barbeiro") && await _pessoaService.ClienteDoProfissional(id, UsuarioAtual()));

    private int UsuarioAtual() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
}
