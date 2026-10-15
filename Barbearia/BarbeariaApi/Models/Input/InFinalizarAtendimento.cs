using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InFinalizarAtendimento
{
    /// <summary>
    /// ID Atendimento: informação do contrato.
    /// </summary>
    [Required]
    public int ID_Atendimento { get; set; }

    /// <summary>
    /// Servicos: informação do contrato.
    /// </summary>
    public List<InServicoRealizado> Servicos { get; set; }

    /// <summary>
    /// Produtos: informação do contrato.
    /// </summary>
    public List<InProdutoVendido> Produtos { get; set; }

    /// <summary>
    /// Forma de pagamento.
    /// </summary>
    [Required, RegularExpression("^(PIX|CREDITO|DEBITO|ESPECIE)$")]
    public string Forma_Pagamento { get; set; }

    /// <summary>
    /// ValorRecebido: informação do contrato.
    /// </summary>
    [Range(0, 9999999.99)]
    public decimal VL_Recebido { get; set; }
}
