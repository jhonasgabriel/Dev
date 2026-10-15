using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class AtendimentoService
{
    private readonly AtendimentoRepository _repository;
    private readonly ServicoRepository _servicoRepository;
    private readonly ProdutoRepository _produtoRepository;

    public AtendimentoService(
        AtendimentoRepository repository,
        ServicoRepository servicoRepository,
        ProdutoRepository produtoRepository)
    {
        _repository = repository;
        _servicoRepository = servicoRepository;
        _produtoRepository = produtoRepository;
    }

    public async Task<OutAtendimento> IniciarAtendimento(InIniciarAtendimento param)
    {
        if (param.ID_Pessoa <= 0)
            throw new ArgumentException("Pessoa inválida.");

        if (param.DT_Atendimento == default)
            param.DT_Atendimento = DateTime.Now;

        return await _repository.IniciarAtendimento(param);
    }

    public async Task<OutAtendimento> FinalizarAtendimento(InFinalizarAtendimento param)
    {
        if (param.ID_Atendimento <= 0)
            throw new ArgumentException("Atendimento inválido.");

        param.Forma_Pagamento = param.Forma_Pagamento?.Trim().ToUpperInvariant();
        if (param.Forma_Pagamento is not ("PIX" or "CREDITO" or "DEBITO" or "ESPECIE"))
            throw new ArgumentException("Forma de pagamento inválida.");

        var servicos = new List<InServicoRealizado>();
        foreach (var id in (param.Servicos ?? []).Select(item => item.ID_Servico).Distinct())
        {
            var servico = await _servicoRepository.ObterPorId(id)
                ?? throw new ArgumentException($"Serviço {id} não encontrado.");
            servicos.Add(new InServicoRealizado
            {
                ID_Servico = servico.ID_Servico,
                NM_Servico = servico.NM_Servico,
                VL_Servico = servico.VL_Servico,
                QT_Minutos = servico.QT_Minutos
            });
        }

        var produtos = new List<InProdutoVendido>();
        foreach (var item in param.Produtos ?? [])
        {
            if (item.QT_Produto <= 0)
                throw new ArgumentException("A quantidade do produto deve ser maior que zero.");

            var produto = await _produtoRepository.ObterPorId(item.ID_Produto)
                ?? throw new ArgumentException($"Produto {item.ID_Produto} não encontrado.");
            produtos.Add(new InProdutoVendido
            {
                ID_Produto = produto.ID_Produto,
                NM_Produto = produto.NM_Produto,
                VL_Produto = produto.VL_Produto,
                QT_Produto = item.QT_Produto
            });
        }

        if (servicos.Count == 0 && produtos.Count == 0)
            throw new ArgumentException("Informe ao menos um serviço ou produto realizado.");

        var total = servicos.Sum(item => item.VL_Servico)
            + produtos.Sum(item => item.VL_Produto * item.QT_Produto);
        if (param.VL_Recebido < 0 || decimal.Round(param.VL_Recebido, 2) != param.VL_Recebido)
            throw new ArgumentException("Valor recebido inválido.");

        if (param.Forma_Pagamento != "ESPECIE" && param.VL_Recebido > total)
            throw new ArgumentException("O valor recebido não pode superar o total, exceto em espécie.");

        param.Servicos = servicos;
        param.Produtos = produtos;
        return await _repository.FinalizarAtendimento(param);
    }
}
