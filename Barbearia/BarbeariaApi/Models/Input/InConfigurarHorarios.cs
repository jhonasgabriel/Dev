using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InConfigurarHorarios
{
    /// <summary>    
    /// Dia da semana
    /// </summary>
    [Required(ErrorMessage = "Dia da semana é obrigatório.")]
    public DayOfWeek Dia_Semana { get; set; }

    /// <summary>
    /// Horário de abertura
    /// </summary>
    [Required(ErrorMessage = "Horário de abertura é obrigatório.")]
    public TimeSpan HR_Abertura { get; set; }

    /// <summary>
    /// Horário de fechamento
    /// </summary>
    [Required(ErrorMessage = "Horário de fechamento é obrigatório.")]
    public TimeSpan HR_Fechamento { get; set; }

    /// <summary>
    /// Horário de início do almoço
    /// </summary>
    public TimeSpan? HR_Inicio_Almoco { get; set; }

    /// <summary>
    /// Horário de fim do almoço
    /// </summary>
    public TimeSpan? HR_Fim_Almoco { get; set; }

    [RegularExpression("^[SN]$")]
    public string SN_Ativo { get; set; } = "S";
}
