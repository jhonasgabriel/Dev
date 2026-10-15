using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InIniciarAtendimento
{
    /// <summary>
    /// ID Agendamento: informação do contrato.
    /// </summary>
    public int? ID_Agendamento { get; set; }
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    [Required]
    public int ID_Pessoa { get; set; }
    /// <summary>
    /// Data do registro.
    /// </summary>
    public DateTime DT_Atendimento { get; set; }
}
