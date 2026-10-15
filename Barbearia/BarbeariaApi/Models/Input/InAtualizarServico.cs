using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InAtualizarServico
{
    /// <summary>
    /// Nome do serviço.
    /// </summary>
    [Required(ErrorMessage = "Nome do serviço é obrigatório.")]
    public string NM_Servico { get; set; }

    /// <summary>
    /// Valor do serviço.
    /// </summary>
    [Range(0.01, 9999999.99, ErrorMessage = "O valor do serviço deve ser maior que zero.")]
    public decimal VL_Servico { get; set; }

    /// <summary>
    /// Duração do serviço em minutos.
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "A duração do serviço deve ser maior que zero.")]
    public int QT_Minutos { get; set; }

    /// <summary>
    /// Descrição opcional do serviço.
    /// </summary>
    public string DS_Servico { get; set; }
}
