namespace BarbeariaApi.Models.Output;

public class OutProduto
{
    /// <summary>
    /// ID Produto: informação do contrato.
    /// </summary>
    public int ID_Produto { get; set; }
    /// <summary>
    /// Nome do produto.
    /// </summary>
    public string NM_Produto { get; set; }
    /// <summary>
    /// Preço do produto.
    /// </summary>
    public decimal VL_Produto { get; set; }
    /// <summary>
    /// Marca do produto.
    /// </summary>
    public string NM_Marca { get; set; }
    /// <summary>
    /// Descrição opcional do produto.
    /// </summary>
    public string DS_Produto { get; set; }
    public string DS_Imagem { get; set; }
    public string SN_Ativo { get; set; }
}
