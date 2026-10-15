using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

public class InCadastrarBarbeiro : InDefinirSenha
{
    /// <summary>Nome do barbeiro; também é o nome usado no login.</summary>
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string NM_Usuario { get; set; }

    [Required]
    [StringLength(20)]
    public string NO_Telefone { get; set; }

    /// <summary>CPF (com ou sem máscara).</summary>
    [Required(ErrorMessage = "Informe o CPF.")]
    [StringLength(14)]
    public string CD_Inscricao_Nacional { get; set; }

    [Required(ErrorMessage = "Informe a data de nascimento.")]
    public DateOnly? DT_Nascimento { get; set; }

    /// <summary>Somente conferida na API (deve ser igual à senha); não é enviada ao banco.</summary>
    [Required(ErrorMessage = "Confirme a senha.")]
    [Compare(nameof(Senha), ErrorMessage = "As senhas não conferem.")]
    public string ConfirmarSenha { get; set; }
}
