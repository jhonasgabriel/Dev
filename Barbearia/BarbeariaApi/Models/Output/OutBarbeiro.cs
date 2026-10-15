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
