namespace BarbeariaApi.Services;

public static class Documento
{
    /// <summary>Normaliza e valida o CPF (dígitos verificadores); retorna somente os 11 números.</summary>
    public static string NormalizarCpf(string cpf)
    {
        var numeros = new string((cpf ?? "").Where(char.IsDigit).ToArray());
        if (numeros.Length != 11 || numeros.Distinct().Count() == 1)
            throw new ArgumentException("CPF inválido.");

        for (var posicao = 9; posicao <= 10; posicao++)
        {
            var soma = 0;
            for (var i = 0; i < posicao; i++)
                soma += (numeros[i] - '0') * (posicao + 1 - i);
            var digito = soma * 10 % 11 % 10;
            if (numeros[posicao] - '0' != digito)
                throw new ArgumentException("CPF inválido.");
        }
        return numeros;
    }
}
