namespace BarbeariaApi.Models.Output;

public class OutDisponibilidade
{
    /// <summary>
    /// Data do registro.
    /// </summary>
    public DateTime DT_Agendamento { get; set; }
    /// <summary>
    /// Dia: informação do contrato.
    /// </summary>
    public string NM_Dia_Semana { get; set; }
    /// <summary>
    /// Mes: informação do contrato.
    /// </summary>
    public int NR_Mes { get; set; }
    /// <summary>
    /// Ano: informação do contrato.
    /// </summary>
    public int NR_Ano { get; set; }
    /// <summary>
    /// Horário disponível.
    /// </summary>
    public TimeSpan HR_Agendamento { get; set; }
    /// <summary>
    /// Situação do registro.
    /// </summary>
    public string ST_Disponibilidade { get; set; } // DISPONIVEL | INDISPONIVEL
}
