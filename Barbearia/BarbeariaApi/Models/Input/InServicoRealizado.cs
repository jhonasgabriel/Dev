using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InServicoRealizado
{
    /// <summary>
    /// Identificadores dos serviços selecionados.
    /// </summary>
    [Required]
    public int ID_Servico { get; set; }

    public string NM_Servico { get; set; }

    /// <summary>
    /// Valor do serviço.
    /// </summary>
    [Required]
    public decimal VL_Servico { get; set; }

    /// <summary>
    /// Duração do serviço em minutos.
    /// </summary>
    public int QT_Minutos { get; set; }
}
