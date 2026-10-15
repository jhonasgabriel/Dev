namespace BarbeariaApi.Models.Output;

public class OutServico
{
    /// <summary>
    /// Identificadores dos serviços selecionados.
    /// </summary>
    public int ID_Servico { get; set; }
    /// <summary>
    /// Nome do serviço.
    /// </summary>
    public string NM_Servico { get; set; }
    /// <summary>
    /// Valor do serviço.
    /// </summary>
    public decimal VL_Servico { get; set; }
    /// <summary>
    /// Duração do serviço em minutos.
    /// </summary>
    public int QT_Minutos { get; set; }
    /// <summary>
    /// Descrição opcional do serviço.
    /// </summary>
    public string DS_Servico { get; set; }
    public string SN_Ativo { get; set; }
}
