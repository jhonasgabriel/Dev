namespace BarbeariaApi.Models.Output;

public class OutHistoricoPessoa
{
    /// <summary>
    /// ID Historico: informação do contrato.
    /// </summary>
    public int ID_Historico { get; set; }
    /// <summary>
    /// Identificador da pessoa.
    /// </summary>
    public int ID_Pessoa { get; set; }
    /// <summary>
    /// Data do registro.
    /// </summary>
    public DateTime DT_Atendimento { get; set; }
    /// <summary>
    /// Descricao: informação do contrato.
    /// </summary>
    public string DS_Servicos { get; set; }

    public decimal VL_Total { get; set; }
    public decimal VL_Recebido { get; set; }
    public decimal VL_Pendente { get; set; }
    public string Forma_Pagamento { get; set; }
    public string ST_Atendimento { get; set; }
}
