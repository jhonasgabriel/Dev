using System.Security.Cryptography;
using System.Text;

namespace BarbeariaApi.Services;

/// <summary>
/// Assinatura da credencial gravada no token: HMAC-SHA256 (chave do JWT) do hash de senha vigente.
/// Quando a senha é trocada o hash muda e os tokens emitidos antes deixam de ser aceitos, sem coluna de versão.
/// A assinatura não revela o hash nem permite testar senhas (exige a chave do servidor).
/// </summary>
public static class AssinaturaCredencial
{
    public static string Gerar(string chaveJwt, string senhaHash)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(chaveJwt));
        var assinatura = hmac.ComputeHash(Encoding.ASCII.GetBytes(senhaHash ?? string.Empty));
        return Convert.ToBase64String(assinatura).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool Conferir(string chaveJwt, string senhaHash, string assinatura)
    {
        if (string.IsNullOrEmpty(senhaHash) || string.IsNullOrEmpty(assinatura))
            return false;

        return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(Gerar(chaveJwt, senhaHash)),
                                                       Encoding.ASCII.GetBytes(assinatura));
    }
}
