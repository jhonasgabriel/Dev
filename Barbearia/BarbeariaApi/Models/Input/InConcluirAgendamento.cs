using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InConcluirAgendamento
{
    [Range(1, int.MaxValue)] public int ID_Agendamento { get; set; }
    public DateTime DT_Atendimento { get; set; }
    [Range(0, 9999999.99)] public decimal VL_Recebido { get; set; }
    [Required, RegularExpression("^(PIX|CREDITO|DEBITO|ESPECIE)$")]
    public string Forma_Pagamento { get; set; }
}

public class InReceberDebito
{
    [Range(1, int.MaxValue)] public int ID_Atendimento { get; set; }
    [Range(0.01, 9999999.99)] public decimal VL_Pagamento { get; set; }
    [Required, RegularExpression("^(PIX|CREDITO|DEBITO|ESPECIE)$")]
    public string Forma_Pagamento { get; set; }
    public Guid CD_Chave { get; set; }
}
