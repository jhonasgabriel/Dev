using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InConsultarAgendamentos
{
    /// <summary>
    /// Data inicial para consulta de agendamentos
    /// </summary>
    [Required(ErrorMessage = "Data inicial é obrigatória.")]
    public DateTime DT_Inicial { get; set; }

    /// <summary>
    /// Data final para consulta de agendamentos
    /// </summary>
    [Required(ErrorMessage = "Data final é obrigatória.")]
    public DateTime DT_Final { get; set; }

    /// <summary>
    /// ID do usuário
    /// </summary>
    public int? ID_Usuario { get; set; }
}
