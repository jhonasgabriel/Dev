namespace BarbeariaApi.Models.Output;

public class OutHorario
{
    /// <summary>
    /// ID_Horario
    /// </summary>
    public int ID_Horario { get; set; }

    /// <summary>
    /// Dia da semana
    /// </summary>
    public DayOfWeek Dia_Semana { get; set; }

    /// <summary>
    /// Horário de abertura
    /// </summary>
    public TimeSpan HR_Abertura { get; set; }

    /// <summary>
    /// Horário de fechamento
    /// </summary>
    public TimeSpan HR_Fechamento { get; set; }

    /// <summary>
    /// Horário de início do almoço
    /// </summary>
    public TimeSpan? HR_Inicio_Almoco { get; set; }

    /// <summary>
    /// Horário de fim do almoço
    /// </summary>
    public TimeSpan? HR_Fim_Almoco { get; set; }
    public string SN_Ativo { get; set; }
}
