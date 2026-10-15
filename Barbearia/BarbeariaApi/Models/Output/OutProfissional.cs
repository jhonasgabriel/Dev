namespace BarbeariaApi.Models.Output;

public class OutProfissional
{
    public int ID_Usuario { get; set; }
    public string NM_Usuario { get; set; }
    public string DS_Imagem { get; set; }
}

/// <summary>Serviço ativo com a indicação se o profissional o realiza.</summary>
public class OutServicoProfissional
{
    public int ID_Servico { get; set; }
    public string NM_Servico { get; set; }
    public decimal VL_Servico { get; set; }
    public int QT_Minutos { get; set; }
    public string DS_Servico { get; set; }
    public bool SN_Realiza { get; set; }
}
