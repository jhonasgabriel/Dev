using System.ComponentModel.DataAnnotations;

namespace BarbeariaApi.Models.Input;

/// <summary>Lista completa dos serviços que o profissional realiza (substitui a seleção anterior).</summary>
public class InServicosProfissional
{
    [Required]
    public List<int> ID_Servico { get; set; }
}
