using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class ControleRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    /// <summary>Concluir = iniciar o atendimento do agendamento e finalizá-lo com os serviços reservados.</summary>
    public async Task Concluir(InConcluirAgendamento input, OutConsultarAgendamentos agenda)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "A");
        parameters.Add("@ID_Agendamento", agenda.ID_Agendamento);
        parameters.Add("@DT_Atendimento", agenda.DT_Agendamento.Date + agenda.HR_Agendamento);
        parameters.Add("@VL_Recebido", input.VL_Recebido);
        parameters.Add("@Forma_Pagamento", input.Forma_Pagamento);
        parameters.Add("@SN_Retorno", "N");

        await conexao.ExecuteAsync(sql: "st_BarbeariaAtendimentoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);
    }
}
