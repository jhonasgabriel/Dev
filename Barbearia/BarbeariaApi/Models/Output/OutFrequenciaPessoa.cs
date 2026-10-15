namespace BarbeariaApi.Models.Output;

public class OutFrequenciaPessoa
{
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    public int ID_Pessoa { get; set; }
    /// <summary>
    /// QuantidadeAtendimentos: informação do contrato.
    /// </summary>
    public int QT_Atendimentos { get; set; }
    /// <summary>
    /// UltimoAtendimento: informação do contrato.
    /// </summary>
    public DateTime? DT_Ultimo_Atendimento { get; set; }
    public decimal VL_Total_Gasto { get; set; }
    public decimal VL_Total_Pendente { get; set; }
}
