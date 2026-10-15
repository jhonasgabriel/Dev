using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InCadastrarAgendamento
{
    /// <summary>
    /// Identificador da pessoa
    /// </summary>
    public int? ID_Pessoa { get; set; }

    /// <summary>Nome do cliente. Obrigatório quando ID_Pessoa não for informado.</summary>
    [StringLength(50, MinimumLength = 3)]
    public string NM_Cliente { get; set; }

    /// <summary>Telefone do cliente. Obrigatório quando ID_Pessoa não for informado.</summary>
    [StringLength(20)]
    public string NO_Telefone { get; set; }

    /// <summary>Barbeiro escolhido; nulo permite qualquer barbeiro disponível.</summary>
    [Range(1, int.MaxValue)]
    public int? ID_Barbeiro { get; set; }

    /// <summary>
    /// Data do agendamento
    /// </summary>
    [Required]
    public DateOnly DT_Agendamento { get; set; }

    /// <summary>
    /// Hora do agendamento
    /// </summary>
    [Required]
    public TimeSpan HR_Agendamento { get; set; }

    /// <summary>
    /// Identificador do serviço
    /// </summary>
    [Required]
    [MinLength(1)]
    public List<int> ID_Servico { get; set; }

    // A forma de pagamento é definida somente no atendimento.
    // Mantida internamente para compatibilidade com a estrutura atual do banco.
    public string Forma_Pagamento { get; set; }
}
