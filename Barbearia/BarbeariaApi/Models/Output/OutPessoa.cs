namespace BarbeariaApi.Models.Output;

public class OutPessoa
{
    /// <summary>
    /// Identificador do usuário
    /// </summary>
    public int ID_Pessoa { get; set; }

    /// <summary>
    /// Nome do usuário
    /// </summary>
    public string NM_Usuario { get; set; }

    /// <summary>
    /// Telefone do usuário
    /// </summary>
    public string NO_Telefone { get; set; }

    /// <summary>
    /// Data de nascimento do usuário
    /// </summary>
    public DateTime? DT_Nascimento { get; set; }
    public string TP_Usuario { get; set; }
    public string SN_Ativo { get; set; }
    public decimal VL_Pendente { get; set; }
    public int QT_Atendimentos { get; set; }
    public DateTime? DT_Ultimo_Atendimento { get; set; }
    public string NM_Barbeiros { get; set; }
}
