using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class DashboardRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutDashboard> Consultar(InConsultarDashboard param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "D");
        parameters.Add("@DT_Inicial", param.DT_Inicial);
        parameters.Add("@DT_Final", param.DT_Final);

        var dashboard = await conexao.QueryFirstOrDefaultAsync<OutDashboard>(sql: "st_BarbeariaControleConsultar",
                                                                             param: parameters,
                                                                             commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return dashboard;
    }
}
