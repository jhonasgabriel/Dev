namespace BarbeariaApi.Models.Output;

public class OutConsultarAgendamentos
{
    public int? ID_Barbeiro { get; set; }
    public string NM_Barbeiro { get; set; }
    /// <summary>
    /// ID do agendamento
    /// </summary>
    public int ID_Agendamento { get; set; }

    /// <summary>
    /// ID da pessoa
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
    /// Tempo estimado do agendamento
    /// </summary>
    public int QT_Minutos_Total { get; set; }

    /// <summary>
    /// Forma de pagamento pretendida
    /// </summary>
    public string Forma_Pagamento { get; set; }

    /// <summary>
    /// Status do agendamento
    /// </summary>
    /// <summary>
    /// Nome do cliente associado ao agendamento.
    /// </summary>
    public string NM_Usuario { get; set; }

    /// <summary>
    /// Descrição dos serviços selecionados.
    /// </summary>
    public string DS_Servicos { get; set; }

    /// <summary>
    /// Situação do registro.
    /// </summary>
    public string ST_Agendamento { get; set; }
}
