namespace BarbeariaApi.Models.Output;

public class OutDashboard
{
    /// <summary>
    /// QuantidadeAtendimentos: informação do contrato.
    /// </summary>
    public int QT_Atendimentos { get; set; }
    /// <summary>
    /// QuantidadeServicos: informação do contrato.
    /// </summary>
    public int QT_Servicos { get; set; }
    /// <summary>
    /// QuantidadeProdutos: informação do contrato.
    /// </summary>
    public int QT_Produtos { get; set; }
    /// <summary>
    /// ValorFaturado: informação do contrato.
    /// </summary>
    public decimal VL_Faturado { get; set; }
    /// <summary>
    /// ValorRecebido: informação do contrato.
    /// </summary>
    public decimal VL_Recebido { get; set; }
    /// <summary>
    /// ValorPendente: informação do contrato.
    /// </summary>
    public decimal VL_Pendente { get; set; }
    /// <summary>
    /// TotalPIX: informação do contrato.
    /// </summary>
    public decimal VL_PIX { get; set; }
    /// <summary>
    /// TotalCredito: informação do contrato.
    /// </summary>
    public decimal VL_Credito { get; set; }
    /// <summary>
    /// TotalDebito: informação do contrato.
    /// </summary>
    public decimal VL_Debito { get; set; }
    /// <summary>
    /// TotalEspecie: informação do contrato.
    /// </summary>
    public decimal VL_Especie { get; set; }
}
