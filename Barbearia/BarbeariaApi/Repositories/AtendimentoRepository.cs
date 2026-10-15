using System.Data;
using System.Text.Json;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class AtendimentoRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutAtendimento> IniciarAtendimento(InIniciarAtendimento param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@ID_Agendamento", param.ID_Agendamento);
        parameters.Add("@ID_Pessoa", param.ID_Pessoa);
        parameters.Add("@DT_Atendimento", param.DT_Atendimento);

        var atendimento = await conexao.QueryFirstOrDefaultAsync<OutAtendimento>(sql: "st_BarbeariaAtendimentoAddUpd",
                                                                                 param: parameters,
                                                                                 commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return atendimento;
    }

    public async Task<OutAtendimento> FinalizarAtendimento(InFinalizarAtendimento param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "F");
        parameters.Add("@ID_Atendimento", param.ID_Atendimento);
        parameters.Add("@ServicosJson", JsonSerializer.Serialize(param.Servicos));
        parameters.Add("@ProdutosJson", JsonSerializer.Serialize(param.Produtos));
        parameters.Add("@Forma_Pagamento", param.Forma_Pagamento);
        parameters.Add("@VL_Recebido", param.VL_Recebido);

        var atendimento = await conexao.QueryFirstOrDefaultAsync<OutAtendimento>(sql: "st_BarbeariaAtendimentoAddUpd",
                                                                                 param: parameters,
                                                                                 commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return atendimento;
    }
}
