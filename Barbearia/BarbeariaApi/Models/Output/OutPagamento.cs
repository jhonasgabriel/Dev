namespace BarbeariaApi.Models.Output;

public class OutPagamento
{
    /// <summary>
    /// ID Pagamento: informação do contrato.
    /// </summary>
    public int ID_Pagamento { get; set; }
    /// <summary>
    /// ID Atendimento: informação do contrato.
    /// </summary>
    public int ID_Atendimento { get; set; }
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    public int ID_Pessoa { get; set; }
    /// <summary>
    /// Valor do pagamento.
    /// </summary>
    public decimal VL_Pagamento { get; set; }
    /// <summary>
    /// Forma de pagamento.
    /// </summary>
    public string Forma_Pagamento { get; set; }
    /// <summary>
    /// Data do registro.
    /// </summary>
    public DateTime DT_Pagamento { get; set; }
}
