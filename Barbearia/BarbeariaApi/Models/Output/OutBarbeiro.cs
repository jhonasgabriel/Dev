namespace BarbeariaApi.Models.Output;

public class OutBarbeiro
{
    public int ID_Usuario { get; set; }
    public int ID_Pessoa { get; set; }
    public string NM_Usuario { get; set; }
    public string NO_Telefone { get; set; }
    public string TP_Usuario { get; set; }
    public string SN_Ativo { get; set; }
    public bool SN_SenhaDefinida { get; set; }
    public string DS_Imagem { get; set; }
}

public class OutResumoBarbeiro
{
    public int QT_Agendamentos { get; set; }
    public int QT_Confirmados { get; set; }
    public int QT_Cancelados { get; set; }
    public int QT_Clientes { get; set; }
    public decimal VL_Faturado { get; set; }
    public decimal VL_Recebido { get; set; }
    public decimal VL_Pendente { get; set; }
}

public class OutClienteBarbeiro
{
    public int ID_Pessoa { get; set; }
    public string NM_Usuario { get; set; }
    public string NO_Telefone { get; set; }
    public string SN_Ativo { get; set; }
    public int QT_Agendamentos { get; set; }
    public int QT_Atendimentos { get; set; }
    public DateTime? DT_Ultimo_Atendimento { get; set; }
    public decimal VL_Total_Gasto { get; set; }
    public decimal VL_Pendente { get; set; }
}

public class OutRelatorioBarbeiro
{
    public OutResumoBarbeiro Resumo { get; set; }
    public IEnumerable<OutServicoControle> Servicos { get; set; }
    public IEnumerable<OutPagamentoControle> Formas_Pagamento { get; set; }
}

public class OutHorarioBarbeiro : OutHorario
{
    public int ID_Barbeiro { get; set; }
    public bool SN_Personalizado { get; set; }
}
