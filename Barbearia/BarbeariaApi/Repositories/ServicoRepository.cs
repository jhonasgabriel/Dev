using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class ServicoRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutServico> Cadastrar(InCadastrarServico param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@NM_Servico", param.NM_Servico);
        parameters.Add("@VL_Servico", param.VL_Servico);
        parameters.Add("@QT_Minutos", param.QT_Minutos);
        parameters.Add("@DS_Servico", param.DS_Servico);

        var servico = await conexao.QueryFirstOrDefaultAsync<OutServico>(sql: "st_BarbeariaServicoAddUpd",
                                                                         param: parameters,
                                                                         commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return servico;
    }

    public async Task<IEnumerable<OutServico>> Listar(bool incluirInativos = false)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@SN_Ativo", incluirInativos ? null : "S");

        var servicos = await conexao.QueryAsync<OutServico>(sql: "st_BarbeariaServicoConsultar",
                                                            param: parameters,
                                                            commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return servicos;
    }

    public async Task<OutServico> ObterPorId(int idServico)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Servico", idServico);
        parameters.Add("@SN_Ativo", "S");

        var servico = await conexao.QueryFirstOrDefaultAsync<OutServico>(sql: "st_BarbeariaServicoConsultar",
                                                                         param: parameters,
                                                                         commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return servico;
    }

    /// <summary>Todos os serviços com o nome: a procedure ordena o ativo primeiro e, entre inativos, o mais recente.</summary>
    public async Task<IEnumerable<OutServico>> ConsultarPorNome(string nome)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@NM_Servico", nome);

        var servicos = await conexao.QueryAsync<OutServico>(sql: "st_BarbeariaServicoConsultar",
                                                            param: parameters,
                                                            commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return servicos;
    }

    public async Task<OutServico> ObterPorNome(string nome) => (await ConsultarPorNome(nome)).FirstOrDefault();

    public async Task<bool> ExisteComNome(string nome, int? idIgnorado = null)
        => (await ConsultarPorNome(nome)).Any(servico => servico.ID_Servico != idIgnorado);

    public async Task<bool> Atualizar(int idServico, InAtualizarServico param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "U");
        parameters.Add("@ID_Servico", idServico);
        parameters.Add("@NM_Servico", param.NM_Servico);
        parameters.Add("@VL_Servico", param.VL_Servico);
        parameters.Add("@QT_Minutos", param.QT_Minutos);
        parameters.Add("@DS_Servico", param.DS_Servico);

        await conexao.ExecuteAsync(sql: "st_BarbeariaServicoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return true;
    }

    /// <summary>Exclusão lógica: preserva o histórico de atendimentos.</summary>
    public Task<bool> Deletar(int idServico) => AlterarStatus(idServico, false);

    public async Task<bool> AlterarStatus(int idServico, bool ativo)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "S");
        parameters.Add("@ID_Servico", idServico);
        parameters.Add("@SN_Ativo", ativo ? "S" : "N");

        await conexao.ExecuteAsync(sql: "st_BarbeariaServicoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return true;
    }
}
