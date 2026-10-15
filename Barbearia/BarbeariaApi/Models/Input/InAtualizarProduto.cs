using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InAtualizarProduto
{
    /// <summary>
    /// Nome do produto.
    /// </summary>
    [Required(ErrorMessage = "Nome do produto é obrigatório.")]
    public string NM_Produto { get; set; }

    /// <summary>
    /// Preço do produto.
    /// </summary>
    [Range(0.01, 9999999.99, ErrorMessage = "O preço do produto deve ser maior que zero.")]
    public decimal VL_Produto { get; set; }

    /// <summary>
    /// Marca do produto.
    /// </summary>
    public string NM_Marca { get; set; }

    /// <summary>
    /// Descrição opcional do produto.
    /// </summary>
    public string DS_Produto { get; set; }
}
