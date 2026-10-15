using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class ProdutoService
{
    private readonly ProdutoRepository _repository;
    private readonly ImagemService _imagens;

    public ProdutoService(ProdutoRepository repository, ImagemService imagens)
    {
        _repository = repository;
        _imagens = imagens;
    }

    public async Task<OutProduto> Cadastrar(InCadastrarProduto param)
    {
        ValidarProduto(param.NM_Produto, param.VL_Produto, param.NM_Marca);
        param.NM_Produto = param.NM_Produto.Trim();
        param.NM_Marca = string.IsNullOrWhiteSpace(param.NM_Marca) ? null : param.NM_Marca.Trim();
        var existente = await _repository.ObterPorNome(param.NM_Produto);
        if (existente != null)
        {
            if (existente.SN_Ativo == "S")
                throw new ArgumentException("Já existe um produto cadastrado com esse nome.");

            await _repository.AlterarStatus(existente.ID_Produto, true);
            existente.SN_Ativo = "S";
            return existente;
        }

        return await _repository.Cadastrar(param);
    }

    public async Task<IEnumerable<OutProduto>> Listar(bool incluirInativos = false)
    {
        return await _repository.Listar(incluirInativos);
    }

    public async Task<bool> Atualizar(int id, InAtualizarProduto param)
    {
        if (id <= 0)
            throw new ArgumentException("ID do produto inválido.");

        ValidarProduto(param.NM_Produto, param.VL_Produto, param.NM_Marca);
        param.NM_Produto = param.NM_Produto.Trim();
        param.NM_Marca = string.IsNullOrWhiteSpace(param.NM_Marca) ? null : param.NM_Marca.Trim();
        if (await _repository.ExisteComNome(param.NM_Produto, id))
            throw new ArgumentException("Já existe outro produto cadastrado com esse nome.");

        return await _repository.Atualizar(id, param);
    }

    public async Task<bool> Deletar(int id)
    {
        return await _repository.Deletar(id);
    }

    public async Task<bool> AlterarStatus(int id, bool ativo)
    {
        if (id <= 0)
            throw new ArgumentException("ID do produto inválido.");

        return await _repository.AlterarStatus(id, ativo);
    }

    public async Task<OutProduto> SalvarImagem(int id, IFormFile imagem)
    {
        if (id <= 0)
            throw new ArgumentException("ID do produto inválido.");

        var produto = await _repository.ObterPorId(id);
        if (produto == null)
            throw new KeyNotFoundException("Produto não encontrado.");

        var caminho = await _imagens.Salvar(imagem, "produtos", $"produto-{id}");
        if (!await _repository.AtualizarImagem(id, caminho))
        {
            _imagens.Remover(caminho, "produtos", "produto-");
            throw new InvalidOperationException("Não foi possível vincular a imagem ao produto.");
        }
        _imagens.Remover(produto.DS_Imagem, "produtos", "produto-");
        return await _repository.ObterPorId(id);
    }

    private static void ValidarProduto(string nome, decimal valor, string marca)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("Nome do produto é obrigatório.");

        if (valor <= 0)
            throw new ArgumentException("O preço do produto deve ser maior que zero.");
    }
}
