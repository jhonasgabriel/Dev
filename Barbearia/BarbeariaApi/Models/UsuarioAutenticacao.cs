using System.Text.Json.Serialization;

namespace BarbeariaApi.Models;

// Modelo interno: nunca retornado pelos endpoints.
public sealed class UsuarioAutenticacao
{
    public int ID_Usuario { get; set; }
    public int ID_Pessoa { get; set; }
    public string NM_Usuario { get; set; }
    public string TP_Usuario { get; set; }
    [JsonIgnore]
    public string DS_SenhaHash { get; set; }
}
