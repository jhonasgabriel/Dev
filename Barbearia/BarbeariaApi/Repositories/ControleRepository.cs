using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class ControleRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutControle> Consultar(DateTime inicio, DateTime fim, int? idPessoa = null)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "C");
        parameters.Add("@DT_Inicial", inicio.Date);
        parameters.Add("@DT_Final", fim.Date);
        parameters.Add("@ID_Pessoa", idPessoa);

        OutControle controle = null;

        // Os parâmetros OUTPUT só ficam disponíveis depois que o leitor é fechado.
        // Se a procedure falhar, ela não devolve os resultados: o erro dela tem prioridade sobre a falha de leitura.
        try
        {
            using var resultado = await conexao.QueryMultipleAsync(sql: "st_BarbeariaControleConsultar",
                                                                   param: parameters,
                                                                   commandType: CommandType.StoredProcedure);

            controle = new OutControle
            {
                Resumo = await resultado.ReadSingleAsync<OutResumoControle>(),
                Debitos = (await resultado.ReadAsync<OutDebitoControle>()).ToList(),
                Finalizados = (await resultado.ReadAsync<int>()).ToList(),
                Servicos = (await resultado.ReadAsync<OutServicoControle>()).ToList(),
                Formas_Pagamento = (await resultado.ReadAsync<OutPagamentoControle>()).ToList(),
                Profissionais = (await resultado.ReadAsync<OutProfissionalControle>()).ToList()
            };
        }
        catch (InvalidOperationException)
        {
            ValidarReturnCode(parameters);
            throw;
        }

        ValidarReturnCode(parameters);

        return controle;
    }

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

    public async Task Receber(InReceberDebito input)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Atendimento", input.ID_Atendimento);
        parameters.Add("@VL_Pagamento", input.VL_Pagamento);
        parameters.Add("@Forma_Pagamento", input.Forma_Pagamento);
        parameters.Add("@CD_Chave", input.CD_Chave);
        parameters.Add("@SN_Retorno", "N");

        await conexao.ExecuteAsync(sql: "st_BarbeariaPagamentoAdd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);
    }
}
