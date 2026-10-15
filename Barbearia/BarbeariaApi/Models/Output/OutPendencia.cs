namespace BarbeariaApi.Models.Output;

public class OutPendencia
{
    /// <summary>
    /// ID Pendencia: informação do contrato.
    /// </summary>
    public int ID_Pendencia { get; set; }
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    public int ID_Pessoa { get; set; }
    /// <summary>
    /// ID Atendimento: informação do contrato.
    /// </summary>
    public int ID_Atendimento { get; set; }
    /// <summary>
    /// ValorOriginal: informação do contrato.
    /// </summary>
    public decimal VL_Original { get; set; }
    /// <summary>
    /// ValorRecebido: informação do contrato.
    /// </summary>
    public decimal VL_Recebido { get; set; }
    /// <summary>
    /// Saldo: informação do contrato.
    /// </summary>
    public decimal VL_Pendente { get; set; }
    /// <summary>
    /// Data do registro.
    /// </summary>
    public DateTime DT_Atendimento { get; set; }
}
