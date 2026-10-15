using System.Security.Claims;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Repositories;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/barbeiros")]
[Authorize(Roles = "Admin,Barbeiro")]
public class BarbeiroController(BarbeiroRepository repository) : ControllerBase
{
    [HttpGet("{id:int}/resumo")]
    public async Task<IActionResult> Resumo(int id, DateTime inicio, DateTime fim)
    {
        var alvo = Resolver(id);
        if (inicio == default || fim < inicio || (fim - inicio).TotalDays > 366)
            return BadRequest(new { message = "Informe um período válido de até 366 dias." });

        return Ok(await repository.Resumo(alvo, inicio, fim));
    }

    [HttpGet("{id:int}/clientes")]
    public async Task<IActionResult> Clientes(int id) => Ok(await repository.Clientes(Resolver(id)));

    [HttpGet("{id:int}/horarios")]
    public async Task<IActionResult> Horarios(int id) => Ok(await repository.Horarios(Resolver(id)));

    [HttpPost("{id:int}/horarios")]
    public async Task<IActionResult> ConfigurarHorario(int id, InConfigurarHorarios input)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        ValidarHorario(input);
        return Ok(await repository.ConfigurarHorario(Resolver(id), input));
    }

    private int Resolver(int solicitado)
    {
        if (User.IsInRole("Admin"))
        {
            if (solicitado <= 0)
                throw new ArgumentException("Barbeiro inválido.");

            return solicitado;
        }
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var atual))
            throw new UnauthorizedAccessException();

        return atual;
    }

    private static void ValidarHorario(InConfigurarHorarios input)
    {
        if (!Enum.IsDefined(input.Dia_Semana) || input.HR_Abertura < TimeSpan.Zero || input.HR_Fechamento >= TimeSpan.FromDays(1)
            || input.HR_Abertura >= input.HR_Fechamento)
            throw new ArgumentException("Horário inválido.");
        if (input.HR_Inicio_Almoco.HasValue != input.HR_Fim_Almoco.HasValue
            || input.HR_Inicio_Almoco.HasValue && (input.HR_Inicio_Almoco >= input.HR_Fim_Almoco
                || input.HR_Inicio_Almoco < input.HR_Abertura || input.HR_Fim_Almoco > input.HR_Fechamento))
            throw new ArgumentException("Horário de almoço inválido.");
    }
}
