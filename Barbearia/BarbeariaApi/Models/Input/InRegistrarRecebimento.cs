using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InRegistrarRecebimento
{
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    [Required]
    public int ID_Pessoa { get; set; }

    /// <summary>
    /// Valor do pagamento.
    /// </summary>
    [Required]
    [Range(0.01, 9999999.99)]
    public decimal VL_Pagamento { get; set; }

    /// <summary>
    /// Forma de pagamento.
    /// </summary>
    [Required]
    [RegularExpression("^(PIX|CREDITO|DEBITO|ESPECIE)$")]
    public string Forma_Pagamento { get; set; }
}
