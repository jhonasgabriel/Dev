using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class ServicoService
{
    private readonly ServicoRepository _repository;

    public ServicoService(ServicoRepository repository)
    {
        _repository = repository;
    }

    public async Task<OutServico> Cadastrar(InCadastrarServico param)
    {
        ValidarServico(param.NM_Servico, param.VL_Servico, param.QT_Minutos);
        param.NM_Servico = param.NM_Servico.Trim();
        var existente = await _repository.ObterPorNome(param.NM_Servico);
        if (existente != null)
        {
            if (existente.SN_Ativo == "S")
                throw new ArgumentException("Já existe um serviço cadastrado com esse nome.");

            await _repository.AlterarStatus(existente.ID_Servico, true);
            existente.SN_Ativo = "S";
            return existente;
        }

        return await _repository.Cadastrar(param);
    }

    public async Task<IEnumerable<OutServico>> Listar(bool incluirInativos = false)
    {
        return await _repository.Listar(incluirInativos);
    }

    public async Task<bool> Atualizar(int id, InAtualizarServico param)
    {
        if (id <= 0)
            throw new ArgumentException("ID do serviço inválido.");

        ValidarServico(param.NM_Servico, param.VL_Servico, param.QT_Minutos);
        param.NM_Servico = param.NM_Servico.Trim();
        if (await _repository.ExisteComNome(param.NM_Servico, id))
            throw new ArgumentException("Já existe outro serviço cadastrado com esse nome.");

        return await _repository.Atualizar(id, param);
    }

    public async Task<bool> Deletar(int id)
    {
        return await _repository.Deletar(id);
    }

    public async Task<bool> AlterarStatus(int id, bool ativo)
    {
        if (id <= 0)
            throw new ArgumentException("ID do serviço inválido.");

        return await _repository.AlterarStatus(id, ativo);
    }

    private static void ValidarServico(string nome, decimal valor, int minutos)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("Nome do serviço é obrigatório.");

        if (valor <= 0)
            throw new ArgumentException("O valor do serviço deve ser maior que zero.");

        if (minutos <= 0)
            throw new ArgumentException("A duração do serviço deve ser maior que zero.");
    }
}
