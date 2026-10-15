using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InConsultarPessoa
{
    /// <summary>
    /// Nome da pessoa
    /// </summary>
    public string NM_Usuario { get; set; }

    /// <summary>
    /// Telefone da pessoa
    /// </summary>
    public string NO_Telefone { get; set; }

    public string SN_Ativo { get; set; }
    public int? ID_Barbeiro { get; set; }
}

