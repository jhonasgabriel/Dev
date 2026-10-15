using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class FinanceiroService
{
    private readonly FinanceiroRepository _repository;

    public FinanceiroService(FinanceiroRepository repository)
    {
        _repository = repository;
    }

    public async Task<OutPagamento> RegistrarPagamento(InRegistrarPagamento param)
    {
        param.Forma_Pagamento = ValidarPagamento(param.VL_Pagamento, param.Forma_Pagamento);
        return await _repository.RegistrarPagamento(param);
    }

    public async Task<OutPagamento> RegistrarRecebimento(InRegistrarRecebimento param)
    {
        param.Forma_Pagamento = ValidarPagamento(param.VL_Pagamento, param.Forma_Pagamento);
        return await _repository.RegistrarRecebimento(param);
    }

    public async Task<IEnumerable<OutPendencia>> ConsultarPendencias(int idPessoa)
    {
        if (idPessoa <= 0)
            throw new ArgumentException("Pessoa inválida.");

        return await _repository.ConsultarPendencias(idPessoa);
    }

    private static string ValidarPagamento(decimal valor, string forma)
    {
        if (valor <= 0 || decimal.Round(valor, 2) != valor)
            throw new ArgumentException("Informe um valor positivo com até duas casas decimais.");

        var normalizada = forma?.Trim().ToUpperInvariant();
        if (normalizada is not ("PIX" or "CREDITO" or "DEBITO" or "ESPECIE"))
            throw new ArgumentException("Forma de pagamento inválida.");

        return normalizada;
    }
}
