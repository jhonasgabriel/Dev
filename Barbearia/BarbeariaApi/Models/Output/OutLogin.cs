namespace BarbeariaApi.Models.Output;

public class OutLogin
{
    /// <summary>
    /// Identificador do usuário
    /// </summary>
    public int ID_Usuario { get; set; }
    public int ID_Pessoa { get; set; }

    /// <summary>
    /// Nome do usuário
    /// </summary>
    public string NM_Usuario { get; set; }

    /// <summary>
    /// Tipo do usuário (ex: Admin, Usuario)
    /// </summary>
    public string TP_Usuario { get; set; }
    public string CD_Token { get; set; }
}
