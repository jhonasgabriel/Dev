using System.Security.Claims;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/agenda")]
[Authorize]
public class AgendaController : ControllerBase
{
    private readonly AgendaService _agendaService;

    public AgendaController(AgendaService agendaService)
    {
        _agendaService = agendaService;
    }

    [HttpPost("consultar-agenda")]
    [AllowAnonymous]
    public async Task<IActionResult> ConsultarAgenda([FromBody] InConsultarAgenda param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var agenda = await _agendaService.ConsultarAgenda(param);
        return Ok(agenda);
    }

    [HttpPost("agendamento")]
    [AllowAnonymous]
    public async Task<IActionResult> CadastrarAgendamento([FromBody] InCadastrarAgendamento param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var equipe = User.IsInRole("Admin") || User.IsInRole("Barbeiro");
        if (!User.IsInRole("Admin"))
            param.ID_Pessoa = null;

        // O barbeiro agenda sempre para si mesmo.
        if (User.IsInRole("Barbeiro"))
            param.ID_Barbeiro = UsuarioAtual();

        var agendamento = await _agendaService.CadastrarAgendamento(param, equipe);
        return Ok(agendamento);
    }

    [HttpPost("consultar-agendamentos")]
    public async Task<IActionResult> ConsultarAgendamentos([FromBody] InConsultarAgendamentos param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!User.IsInRole("Admin"))
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idPessoa))
                return Forbid();

            param.ID_Usuario = idPessoa;
        }
        var agendamentos = await _agendaService.ConsultarAgendamentos(param);
        return Ok(agendamentos);
    }

    [HttpPost("{idAgendamento:int}/cancelar")]
    public async Task<IActionResult> CancelarAgendamento(int idAgendamento)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idPessoa))
            return Forbid();

        await _agendaService.CancelarAgendamento(idAgendamento, idPessoa);
        return NoContent();
    }

    [HttpPost("configurar-horarios")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConfigurarHorarios([FromBody] InConfigurarHorarios param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var horario = await _agendaService.ConfigurarHorarios(param);
        return Ok(horario);
    }

    [HttpGet("horarios")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConsultarHorarios() => Ok(await _agendaService.ConsultarHorarios());

    // Admin: bloqueios gerais da barbearia. Barbeiro: bloqueios somente da própria agenda.
    [HttpGet("bloqueios")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> ConsultarBloqueios([FromQuery] DateTime data) =>
        Ok(await _agendaService.ConsultarBloqueios(data, BarbeiroAtual()));

    [HttpPost("bloquear-horario")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> BloquearHorario([FromBody] InBloquearHorario param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ok = await _agendaService.BloquearHorario(param, BarbeiroAtual());
        if (!ok)
            return BadRequest();

        return NoContent();
    }

    [HttpPost("desbloquear-horario")]
    [Authorize(Roles = "Admin,Barbeiro")]
    public async Task<IActionResult> DesbloquearHorario([FromBody] InDesbloquearHorario param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ok = await _agendaService.DesbloquearHorario(param, BarbeiroAtual());
        if (!ok)
            return NotFound();

        return NoContent();
    }

    private int UsuarioAtual() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();

    // Nulo para o Admin (bloqueio geral); o próprio ID para o barbeiro.
    private int? BarbeiroAtual() => User.IsInRole("Admin") ? null : UsuarioAtual();
}
