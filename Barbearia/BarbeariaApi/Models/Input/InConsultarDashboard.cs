using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InConsultarDashboard
{
    /// <summary>
    /// DataInicio: informação do contrato.
    /// </summary>
    public DateTime? DT_Inicial { get; set; }
    /// <summary>
    /// DataFim: informação do contrato.
    /// </summary>
    public DateTime? DT_Final { get; set; }
}
