using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class FinanceiroRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutPagamento> RegistrarPagamento(InRegistrarPagamento param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Atendimento", param.ID_Atendimento);
        parameters.Add("@ID_Pessoa", param.ID_Pessoa);
        parameters.Add("@VL_Pagamento", param.VL_Pagamento);
        parameters.Add("@Forma_Pagamento", param.Forma_Pagamento);

        var pagamento = await conexao.QueryFirstOrDefaultAsync<OutPagamento>(sql: "st_BarbeariaPagamentoAdd",
                                                                             param: parameters,
                                                                             commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return pagamento;
    }

    /// <summary>Sem atendimento informado, a procedure quita o débito mais antigo do cliente.</summary>
    public async Task<OutPagamento> RegistrarRecebimento(InRegistrarRecebimento param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Pessoa", param.ID_Pessoa);
        parameters.Add("@VL_Pagamento", param.VL_Pagamento);
        parameters.Add("@Forma_Pagamento", param.Forma_Pagamento);

        var pagamento = await conexao.QueryFirstOrDefaultAsync<OutPagamento>(sql: "st_BarbeariaPagamentoAdd",
                                                                             param: parameters,
                                                                             commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return pagamento;
    }

    public async Task<IEnumerable<OutPendencia>> ConsultarPendencias(int idPessoa)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "P");
        parameters.Add("@ID_Pessoa", idPessoa);

        var pendencias = await conexao.QueryAsync<OutPendencia>(sql: "st_BarbeariaPessoaHistoricoConsultar",
                                                                param: parameters,
                                                                commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return pendencias;
    }
}
