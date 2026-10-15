using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InDefinirSenha
{
    [Required]
    [StringLength(128, MinimumLength = 10,
        ErrorMessage = "Senha deve ter entre 10 e 128 caracteres.")]
    public string Senha { get; set; }
}
