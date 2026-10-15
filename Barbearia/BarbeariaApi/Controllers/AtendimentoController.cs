using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/atendimentos")]
[Authorize(Roles = "Admin")]
public class AtendimentoController : ControllerBase
{
    private readonly AtendimentoService _service;

    public AtendimentoController(AtendimentoService service)
    {
        _service = service;
    }

    [HttpPost("iniciar")]
    public async Task<IActionResult> Iniciar([FromBody] InIniciarAtendimento param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var at = await _service.IniciarAtendimento(param);
        return Ok(at);
    }

    [HttpPost("finalizar")]
    public async Task<IActionResult> Finalizar([FromBody] InFinalizarAtendimento param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var at = await _service.FinalizarAtendimento(param);
        return Ok(at);
    }
}
