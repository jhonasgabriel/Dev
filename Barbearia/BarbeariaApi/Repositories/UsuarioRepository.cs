using System.Data;
using System.Text.Json;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class UsuarioRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    /// <summary>Profissionais ativos; com serviços informados, somente os que realizam todos eles.</summary>
    public async Task<IEnumerable<OutProfissional>> ListarProfissionais(IEnumerable<int> servicos = null)
    {
        using var conexao = Connection;
        conexao.Open();

        var idsServico = servicos?.Where(id => id > 0).Distinct().ToList();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "P");
        parameters.Add("@ID_Servico", idsServico is { Count: > 0 } ? JsonSerializer.Serialize(idsServico) : null);

        var profissionais = await conexao.QueryAsync<OutProfissional>(sql: "st_BarbeariaBarbeiroConsultar",
                                                                      param: parameters,
                                                                      commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return profissionais;
    }

    public async Task<IEnumerable<OutBarbeiro>> ListarBarbeiros()
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "L");

        var barbeiros = await conexao.QueryAsync<OutBarbeiro>(sql: "st_BarbeariaBarbeiroConsultar",
                                                              param: parameters,
                                                              commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return barbeiros;
    }

    /// <summary>Nome, telefone ou CPF duplicado retornam regra de negócio (Return_Code 2 → HTTP 409).</summary>
    public async Task<OutBarbeiro> CadastrarBarbeiro(InCadastrarBarbeiro input, string senhaHash)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@NM_Usuario", input.NM_Usuario);
        parameters.Add("@CD_Inscricao_Nacional", input.CD_Inscricao_Nacional);
        parameters.Add("@DT_Nascimento", input.DT_Nascimento?.ToDateTime(TimeOnly.MinValue), DbType.Date);
        parameters.Add("@NO_Telefone", input.NO_Telefone);
        parameters.Add("@DS_SenhaHash", senhaHash, DbType.AnsiString, size: 255);

        var barbeiro = await conexao.QueryFirstOrDefaultAsync<OutBarbeiro>(sql: "st_BarbeariaBarbeiroAddUpd",
                                                                           param: parameters,
                                                                           commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return barbeiro;
    }

    public async Task<bool> DefinirSenhaBarbeiro(int idUsuario, string senhaHash)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "P");
        parameters.Add("@ID_Usuario", idUsuario);
        parameters.Add("@DS_SenhaHash", senhaHash, DbType.AnsiString, size: 255);

        var alterado = await conexao.QueryFirstOrDefaultAsync<bool>(sql: "st_BarbeariaBarbeiroAddUpd",
                                                                    param: parameters,
                                                                    commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return alterado;
    }

    public async Task<bool> AtualizarFoto(int idUsuario, string caminho)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "F");
        parameters.Add("@ID_Usuario", idUsuario);
        parameters.Add("@DS_Imagem", caminho);

        var alterado = await conexao.QueryFirstOrDefaultAsync<bool>(sql: "st_BarbeariaBarbeiroAddUpd",
                                                                    param: parameters,
                                                                    commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return alterado;
    }

    public async Task<IEnumerable<OutServicoProfissional>> Servicos(int idUsuario)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "S");
        parameters.Add("@ID_Barbeiro", idUsuario);

        var servicos = await conexao.QueryAsync<OutServicoProfissional>(sql: "st_BarbeariaBarbeiroConsultar",
                                                                        param: parameters,
                                                                        commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return servicos;
    }

    public async Task DefinirServicos(int idUsuario, IEnumerable<int> servicos)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "S");
        parameters.Add("@ID_Usuario", idUsuario);
        parameters.Add("@ID_Servico", JsonSerializer.Serialize(servicos.Distinct()));

        await conexao.ExecuteAsync(sql: "st_BarbeariaBarbeiroAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);
    }
}
