using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InLogin
{
    /// <summary>
    /// Nome do usuário
    /// </summary>
    [Required(ErrorMessage = "Nome é obrigatório")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Nome deve ter entre 3 e 50 caracteres")]
    public string NM_Usuario { get; set; }

    /// <summary>
    /// Senha do administrador ou barbeiro
    /// </summary>
    [Required(ErrorMessage = "Senha é obrigatória")]
    [StringLength(128, ErrorMessage = "Senha deve ter no máximo 128 caracteres")]
    public string Senha { get; set; }
}
