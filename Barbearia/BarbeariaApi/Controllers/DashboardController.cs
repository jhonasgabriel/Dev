using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _service;

    public DashboardController(DashboardService service)
    {
        _service = service;
    }

    [HttpPost("consultar")]
    public async Task<IActionResult> Consultar([FromBody] InConsultarDashboard param)
    {
        var result = await _service.Consultar(param);
        return Ok(result);
    }
}
