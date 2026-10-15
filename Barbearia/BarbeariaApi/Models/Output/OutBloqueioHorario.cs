namespace BarbeariaApi.Models.Output;

public class OutBloqueioHorario
{
    public int ID_BloqueioHorario { get; set; }
    public DateTime DT_Bloqueio { get; set; }
    public TimeSpan HR_Inicio { get; set; }
    public TimeSpan HR_Fim { get; set; }
    public string DS_Motivo { get; set; }
    /// <summary>Nulo: bloqueio geral da barbearia.</summary>
    public int? ID_Barbeiro { get; set; }
}
