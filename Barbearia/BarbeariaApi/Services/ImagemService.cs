namespace BarbeariaApi.Services;

/// <summary>
/// Upload de imagens (produtos e fotos dos profissionais): aceita somente JPEG, PNG ou WebP de até 5 MB,
/// conferindo a assinatura real do arquivo (não apenas o Content-Type informado pelo navegador).
/// </summary>
public class ImagemService(IWebHostEnvironment environment, IConfiguration configuration)
{
    private static readonly Dictionary<string, string> Extensoes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp"
    };

    /// <summary>
    /// Pasta física das imagens enviadas: "Imagens:Diretorio" na configuração ou, por padrão, Barbearia/obj/img
    /// (fora do código versionado). É publicada pela API em /uploads.
    /// </summary>
    public static string Diretorio(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var configurado = configuration["Imagens:Diretorio"];
        return Path.GetFullPath(string.IsNullOrWhiteSpace(configurado)
            ? Path.Combine(environment.ContentRootPath, "..", "obj", "img")
            : Path.Combine(environment.ContentRootPath, configurado));
    }

    private string Raiz => Diretorio(environment, configuration);

    /// <summary>Grava a imagem em {Diretorio}/{pasta} e retorna o caminho público (/uploads/{pasta}/arquivo).</summary>
    public async Task<string> Salvar(IFormFile imagem, string pasta, string prefixo)
    {
        if (imagem == null || imagem.Length == 0)
            throw new ArgumentException("Selecione uma imagem.");

        if (imagem.Length > 5 * 1024 * 1024)
            throw new ArgumentException("A imagem deve possuir no máximo 5 MB.");

        if (!Extensoes.TryGetValue(imagem.ContentType ?? "", out var extensao))
            throw new ArgumentException("Formato inválido. Envie uma imagem JPEG, PNG ou WebP.");

        var cabecalho = new byte[12];
        await using (var leitura = imagem.OpenReadStream())
        {
            var quantidade = await leitura.ReadAtLeastAsync(cabecalho, 12, throwOnEndOfStream: false);
            var valido = quantidade >= 12 && (extensao switch
            {
                ".jpg" => cabecalho[0] == 0xff && cabecalho[1] == 0xd8 && cabecalho[2] == 0xff,
                ".png" => cabecalho.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
                ".webp" => System.Text.Encoding.ASCII.GetString(cabecalho, 0, 4) == "RIFF"
                        && System.Text.Encoding.ASCII.GetString(cabecalho, 8, 4) == "WEBP",
                _ => false
            });
            if (!valido)
                throw new ArgumentException("O arquivo não corresponde a uma imagem JPEG, PNG ou WebP.");
        }

        var destinoPasta = Path.Combine(Raiz, pasta);
        Directory.CreateDirectory(destinoPasta);
        var nomeArquivo = $"{prefixo}-{Guid.NewGuid():N}{extensao}";
        await using (var stream = File.Create(Path.Combine(destinoPasta, nomeArquivo)))
            await imagem.CopyToAsync(stream);
        return $"/uploads/{pasta}/{nomeArquivo}";
    }

    /// <summary>Remove um arquivo enviado anteriormente, somente se estiver dentro da pasta de uploads indicada.</summary>
    public void Remover(string caminho, string pasta, string prefixo)
    {
        if (string.IsNullOrWhiteSpace(caminho) || !caminho.StartsWith($"/uploads/{pasta}/{prefixo}", StringComparison.OrdinalIgnoreCase))
            return;

        var pastaCompleta = Path.GetFullPath(Path.Combine(Raiz, pasta));
        var relativo = caminho["/uploads/".Length..].Replace('/', Path.DirectorySeparatorChar);
        var arquivo = Path.GetFullPath(Path.Combine(Raiz, relativo));
        if (arquivo.StartsWith(pastaCompleta + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) && File.Exists(arquivo))
            File.Delete(arquivo);
    }
}
