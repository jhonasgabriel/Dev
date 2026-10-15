using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/servicos")]
[Authorize]
public class ServicoController : ControllerBase
{
    private readonly ServicoService _servicoService;

    public ServicoController(ServicoService servicoService)
    {
        _servicoService = servicoService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Cadastrar([FromBody] InCadastrarServico param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var servico = await _servicoService.Cadastrar(param);
        return StatusCode(StatusCodes.Status201Created, servico);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar([FromQuery] bool incluirInativos = false)
    {
        if (incluirInativos && !User.IsInRole("Admin"))
            return Forbid();

        var list = await _servicoService.Listar(incluirInativos);
        return Ok(list);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] InAtualizarServico param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ok = await _servicoService.Atualizar(id, param);
        if (!ok)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deletar(int id)
    {
        var ok = await _servicoService.Deletar(id);
        if (!ok)
            return NotFound();

        return NoContent();
    }

    [HttpPatch("{id}/ativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Ativar(int id) =>
        await _servicoService.AlterarStatus(id, true) ? NoContent() : NotFound();

    [HttpPatch("{id}/inativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Inativar(int id) =>
        await _servicoService.AlterarStatus(id, false) ? NoContent() : NotFound();
}
