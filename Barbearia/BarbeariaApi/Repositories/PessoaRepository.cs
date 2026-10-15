using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class PessoaRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutPessoa> Cadastrar(InCadastrarPessoa param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@NM_Pessoa", param.NM_Usuario);
        parameters.Add("@NO_Telefone", param.NO_Telefone);
        parameters.Add("@DT_Nascimento", param.DT_Nascimento?.ToDateTime(TimeOnly.MinValue), DbType.Date);
        parameters.Add("@TP_Pessoa", "C");

        var pessoa = await conexao.QueryFirstOrDefaultAsync<OutPessoa>(sql: "st_BarbeariaPessoaAddUpd",
                                                                       param: parameters,
                                                                       commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return pessoa;
    }

    public async Task<OutPessoa> ObterPorTelefone(string telefone)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@NO_Telefone", telefone);
        parameters.Add("@SN_Ativo", "S");

        var pessoa = await conexao.QueryFirstOrDefaultAsync<OutPessoa>(sql: "st_BarbeariaPessoaConsultar",
                                                                       param: parameters,
                                                                       commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return pessoa;
    }

    public async Task<IEnumerable<OutPessoa>> Consultar(InConsultarPessoa param, int? idPessoa = null)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@NM_Usuario", param.NM_Usuario);
        parameters.Add("@NO_Telefone", param.NO_Telefone);
        parameters.Add("@SN_Ativo", param.SN_Ativo);
        parameters.Add("@ID_Barbeiro", param.ID_Barbeiro);
        parameters.Add("@ID_Pessoa", idPessoa);

        var pessoas = await conexao.QueryAsync<OutPessoa>(sql: "st_BarbeariaPessoaConsultar",
                                                          param: parameters,
                                                          commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return pessoas;
    }

    public async Task<bool> Atualizar(int idPessoa, InAtualizarPessoa param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "U");
        parameters.Add("@ID_Pessoa", idPessoa);
        parameters.Add("@NM_Pessoa", param.NM_Usuario);
        parameters.Add("@NO_Telefone", param.NO_Telefone);
        parameters.Add("@DT_Nascimento", param.DT_Nascimento?.ToDateTime(TimeOnly.MinValue), DbType.Date);

        await conexao.ExecuteAsync(sql: "st_BarbeariaPessoaAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return true;
    }

    /// <summary>Exclusão lógica: preserva os vínculos de agenda e financeiro.</summary>
    public Task<bool> Deletar(int idPessoa) => AlterarStatus(idPessoa, false);

    public async Task<bool> AlterarStatus(int idPessoa, bool ativo)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "S");
        parameters.Add("@ID_Pessoa", idPessoa);
        parameters.Add("@SN_Ativo", ativo ? "S" : "N");

        await conexao.ExecuteAsync(sql: "st_BarbeariaPessoaAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return true;
    }

    public async Task<IEnumerable<OutHistoricoPessoa>> Historico(int idPessoa)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "H");
        parameters.Add("@ID_Pessoa", idPessoa);

        var historico = await conexao.QueryAsync<OutHistoricoPessoa>(sql: "st_BarbeariaPessoaHistoricoConsultar",
                                                                     param: parameters,
                                                                     commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return historico;
    }

    public async Task<OutFrequenciaPessoa> Frequencia(int idPessoa)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "F");
        parameters.Add("@ID_Pessoa", idPessoa);

        var frequencia = await conexao.QueryFirstOrDefaultAsync<OutFrequenciaPessoa>(sql: "st_BarbeariaPessoaHistoricoConsultar",
                                                                                     param: parameters,
                                                                                     commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return frequencia;
    }
}
