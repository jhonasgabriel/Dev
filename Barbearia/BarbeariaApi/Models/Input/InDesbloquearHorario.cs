using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InDesbloquearHorario
{
    /// <summary>
    /// ID Agenda: informação do contrato.
    /// </summary>
    public int? ID_Agenda { get; set; }

    /// <summary>
    /// Data do bloqueio ou desbloqueio.
    /// </summary>
    [Required(ErrorMessage = "Dia da semana é obrigatório.")]
    public DateTime DT_Bloqueio { get; set; }

    /// <summary>
    /// Horário inicial do intervalo.
    /// </summary>
    [Required(ErrorMessage = "Hora inicial é obrigatória.")]
    public TimeSpan HR_Inicio { get; set; }

    /// <summary>
    /// Horário final do intervalo.
    /// </summary>
    [Required(ErrorMessage = "Hora final é obrigatória.")]
    public TimeSpan HR_Fim { get; set; }
}
