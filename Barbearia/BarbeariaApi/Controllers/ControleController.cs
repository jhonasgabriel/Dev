using System.Security.Claims;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/controle")]
[Authorize(Roles = "Admin,Barbeiro")]
public class ControleController(ControleRepository controle, AgendaRepository agenda) : ControllerBase
{
    [HttpPost("finalizar")]
    public async Task<IActionResult> Finalizar(InConcluirAgendamento input)
    {
        if (input.DT_Atendimento == default || input.DT_Atendimento.Year < 2000)
            return BadRequest(new { message = "Informe uma data de atendimento válida." });

        var registros = await agenda.ConsultarAgendamentos(new InConsultarAgendamentos
        {
            DT_Inicial = input.DT_Atendimento.Date,
            DT_Final = input.DT_Atendimento.Date,
            ID_Usuario = User.IsInRole("Admin") ? null : int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier))
        });
        var item = registros.SingleOrDefault(a => a.ID_Agendamento == input.ID_Agendamento);
        if (item == null)
            return NotFound(new { message = "Agendamento não encontrado." });

        var status = (item.ST_Agendamento ?? "").Trim().ToLowerInvariant();
        if (status.Contains("cancel") || status.Contains("falt"))
            return Conflict(new { message = "Agendamento cancelado ou marcado como falta." });

        if (status.Contains("final") || status.Contains("conclu"))
            return Conflict(new { message = "Agendamento já finalizado." });

        if ((input.Forma_Pagamento != "ESPECIE" && input.VL_Recebido > item.VL_Total)
            || decimal.Round(input.VL_Recebido, 2) != input.VL_Recebido)
            return BadRequest(new { message = "Valor recebido inválido ou superior ao total." });

        await controle.Concluir(input, item);
        return NoContent();
    }
}
