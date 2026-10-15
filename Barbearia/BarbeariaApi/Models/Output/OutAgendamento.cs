namespace BarbeariaApi.Models.Output;

public class OutAgendamento
{
    public int? ID_Barbeiro { get; set; }
    /// <summary>
    /// Identificador do agendamento
    /// </summary>
    public int ID_Agendamento { get; set; }

    /// <summary>
    /// Identificador do usuário
    /// </summary>
    public int ID_Pessoa { get; set; }

    /// <summary>
    /// Data do agendamento
    /// </summary>
    public DateTime DT_Agendamento { get; set; }

    /// <summary>
    /// Hora do agendamento
    /// </summary>
    public TimeSpan HR_Agendamento { get; set; }

    /// <summary>
    /// Valor total do agendamento
    /// </summary>
    public decimal VL_Total { get; set; }

    /// <summary>
    /// Quantidade de tempo do agendamento
    /// </summary>
    public int QT_Tempo { get; set; }
    /// <summary>
    /// Forma de pagamento do agendamento
    /// </summary>
    public string Forma_Pagamento { get; set; }
    /// <summary>
    /// Status do agendamento
    /// </summary>
    public string ST_Agendamento { get; set; }
}
