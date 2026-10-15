namespace BarbeariaApi.Models.Output;

public class OutDebitoControle
{
    public int ID_Atendimento { get; set; }
    public int ID_Agendamento { get; set; }
    public int ID_Pessoa { get; set; }
    public string NM_Usuario { get; set; }
    public string DS_Servicos { get; set; }
    public DateTime DT_Atendimento { get; set; }
    public decimal VL_Total { get; set; }
    public decimal VL_Recebido { get; set; }
    public decimal VL_Pendente { get; set; }
}

public class OutResumoControle
{
    public decimal VL_Recebido { get; set; }
    public decimal VL_Faturado { get; set; }
    public decimal VL_Pendente { get; set; }
    public int QT_Atendimentos { get; set; }
    public decimal VL_Pix { get; set; }
    public decimal VL_Credito { get; set; }
    public decimal VL_Debito { get; set; }
    public decimal VL_Especie { get; set; }
}

public class OutControle
{
    public OutResumoControle Resumo { get; set; }
    public IEnumerable<OutDebitoControle> Debitos { get; set; }
    public IEnumerable<int> Finalizados { get; set; }
    public IEnumerable<OutServicoControle> Servicos { get; set; }
    public IEnumerable<OutPagamentoControle> Formas_Pagamento { get; set; }
    public IEnumerable<OutProfissionalControle> Profissionais { get; set; }
}

public class OutProfissionalControle
{
    public int ID_Usuario { get; set; }
    public string NM_Usuario { get; set; }
    public string TP_Usuario { get; set; }
    public int QT_Atendimentos { get; set; }
    public decimal VL_Faturado { get; set; }
    public decimal VL_Recebido { get; set; }
    public decimal VL_Pendente { get; set; }
}

public class OutServicoControle
{
    public string NM_Servico { get; set; }
    public decimal VL_Unitario { get; set; }
    public int QT_Servicos { get; set; }
    public decimal VL_Total { get; set; }
}

public class OutPagamentoControle
{
    public string Forma_Pagamento { get; set; }
    public int QT_Pagamentos { get; set; }
    public decimal VL_Total { get; set; }
}
