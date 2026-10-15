using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InCadastrarPessoa
{
    /// <summary>
    /// Nome do usuário
    /// </summary>
    [Required(ErrorMessage = "Nome é obrigatório")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Nome deve ter entre 3 e 50 caracteres")]
    public string NM_Usuario { get; set; }

    /// <summary>
    /// Telefone do usuário
    /// </summary>
    public string NO_Telefone { get; set; }

    /// <summary>
    /// Data de nascimento do usuário
    /// </summary>
    public DateOnly? DT_Nascimento { get; set; }
}

