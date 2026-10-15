using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InProdutoVendido
{
    /// <summary>
    /// ID Produto: informação do contrato.
    /// </summary>
    [Required]
    public int ID_Produto { get; set; }

    public string NM_Produto { get; set; }

    /// <summary>
    /// Preço do produto.
    /// </summary>
    [Required]
    public decimal VL_Produto { get; set; }

    /// <summary>
    /// Quantidade: informação do contrato.
    /// </summary>
    [Required]
    [Range(1, int.MaxValue)]
    public int QT_Produto { get; set; }
}
