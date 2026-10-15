using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InConsultarAgenda
{
    /// <summary>
    /// Data do agendamento.
    /// </summary>
    [Required]
    public DateOnly DT_Agendamento { get; set; }

    /// <summary>
    /// Identificadores dos serviços selecionados.
    /// </summary>
    [Required]
    [MinLength(1)]
    public List<int> ID_Servico { get; set; }

    [Range(1, int.MaxValue)]
    public int? ID_Barbeiro { get; set; }
}
