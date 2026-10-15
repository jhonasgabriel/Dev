namespace BarbeariaApi.Models.Output;

public class OutAtendimento
{
    /// <summary>
    /// ID Atendimento: informação do contrato.
    /// </summary>
    public int ID_Atendimento { get; set; }
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    public int ID_Pessoa { get; set; }
    /// <summary>
    /// ID Agendamento: informação do contrato.
    /// </summary>
    public int? ID_Agendamento { get; set; }
    /// <summary>
    /// Data do registro.
    /// </summary>
    public DateTime DT_Atendimento { get; set; }
    /// <summary>
    /// VL Total: informação do contrato.
    /// </summary>
    public decimal VL_Total { get; set; }
    /// <summary>
    /// VL Recebido: informação do contrato.
    /// </summary>
    public decimal VL_Recebido { get; set; }
    /// <summary>
    /// VL Pendente: informação do contrato.
    /// </summary>
    public decimal VL_Pendente { get; set; }
    /// <summary>
    /// Forma de pagamento.
    /// </summary>
    public string Forma_Pagamento { get; set; }

    public decimal VL_Troco { get; set; }

    public string ST_Atendimento { get; set; }
}
