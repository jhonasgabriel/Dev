using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/financeiro")]
[Authorize(Roles = "Admin")]
public class FinanceiroController : ControllerBase
{
    private readonly FinanceiroService _service;

    public FinanceiroController(FinanceiroService service)
    {
        _service = service;
    }

    [HttpPost("registrar-pagamento")]
    public async Task<IActionResult> RegistrarPagamento([FromBody] InRegistrarPagamento param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var pago = await _service.RegistrarPagamento(param);
        return Ok(pago);
    }

    [HttpPost("registrar-recebimento")]
    public async Task<IActionResult> RegistrarRecebimento([FromBody] InRegistrarRecebimento param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var rec = await _service.RegistrarRecebimento(param);
        return Ok(rec);
    }

    [HttpGet("pendencias/{idPessoa}")]
    public async Task<IActionResult> ConsultarPendencias(int idPessoa)
    {
        var list = await _service.ConsultarPendencias(idPessoa);
        return Ok(list);
    }
}
