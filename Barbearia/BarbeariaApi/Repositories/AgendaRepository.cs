using System.Data;
using System.Text.Json;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class AgendaRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<IEnumerable<OutDisponibilidade>> ConsultarAgenda(InConsultarAgenda param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "D");
        parameters.Add("@DT_Inicial", param.DT_Agendamento.ToDateTime(TimeOnly.MinValue));
        parameters.Add("@ID_Servico", JsonSerializer.Serialize(param.ID_Servico));
        parameters.Add("@ID_Barbeiro", param.ID_Barbeiro);

        var horarios = await conexao.QueryAsync<OutDisponibilidade>(sql: "st_BarbeariaAgendaConsultar",
                                                                    param: parameters,
                                                                    commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return horarios;
    }

    public async Task<OutAgendamento> CadastrarAgendamento(InCadastrarAgendamento param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@DT_Agendamento", param.DT_Agendamento.ToDateTime(TimeOnly.MinValue));
        parameters.Add("@HR_Agendamento", param.HR_Agendamento);
        parameters.Add("@ID_Servico", JsonSerializer.Serialize(param.ID_Servico));
        parameters.Add("@ID_Pessoa", param.ID_Pessoa);
        parameters.Add("@ID_Barbeiro", param.ID_Barbeiro);
        parameters.Add("@NM_Cliente", param.NM_Cliente);
        parameters.Add("@NO_Telefone", param.NO_Telefone);

        var agendamento = await conexao.QueryFirstOrDefaultAsync<OutAgendamento>(sql: "st_BarbeariaAgendamentoAddUpd",
                                                                                 param: parameters,
                                                                                 commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return agendamento;
    }

    public async Task CancelarAgendamento(int idAgendamento, int idUsuario)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "C");
        parameters.Add("@ID_Agendamento", idAgendamento);
        parameters.Add("@ID_Usuario", idUsuario);

        await conexao.ExecuteAsync(sql: "st_BarbeariaAgendamentoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);
    }

    public async Task<IEnumerable<OutConsultarAgendamentos>> ConsultarAgendamentos(InConsultarAgendamentos param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "A");
        parameters.Add("@DT_Inicial", param.DT_Inicial);
        parameters.Add("@DT_Final", param.DT_Final.Date);
        parameters.Add("@ID_Barbeiro", param.ID_Usuario);

        var agendamentos = await conexao.QueryAsync<OutConsultarAgendamentos>(sql: "st_BarbeariaAgendaConsultar",
                                                                              param: parameters,
                                                                              commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return agendamentos;
    }

    /// <summary>Horário global da barbearia (sem profissional).</summary>
    public async Task<OutHorario> ConfigurarHorarios(InConfigurarHorarios param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@Dia_Semana", (int)param.Dia_Semana);
        parameters.Add("@HR_Abertura", param.HR_Abertura);
        parameters.Add("@HR_Fechamento", param.HR_Fechamento);
        parameters.Add("@HR_Inicio_Almoco", param.HR_Inicio_Almoco);
        parameters.Add("@HR_Fim_Almoco", param.HR_Fim_Almoco);
        parameters.Add("@SN_Ativo", param.SN_Ativo);

        var horario = await conexao.QueryFirstOrDefaultAsync<OutHorario>(sql: "st_BarbeariaHorarioAddUpd",
                                                                         param: parameters,
                                                                         commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return horario;
    }

    public async Task<IEnumerable<OutHorario>> ConsultarHorarios()
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();

        var horarios = await conexao.QueryAsync<OutHorario>(sql: "st_BarbeariaHorarioConsultar",
                                                            param: parameters,
                                                            commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return horarios;
    }

    public async Task<bool> CadastrarBloqueio(int? idBarbeiro, DateTime data, TimeSpan inicio, TimeSpan fim, string motivo)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@DT_Bloqueio", data);
        parameters.Add("@HR_Inicio", inicio);
        parameters.Add("@HR_Fim", fim);
        parameters.Add("@DS_Motivo", motivo);
        parameters.Add("@ID_Barbeiro", idBarbeiro);

        var bloqueado = await conexao.QueryFirstOrDefaultAsync<bool>(sql: "st_BarbeariaBloqueioAddUpd",
                                                                     param: parameters,
                                                                     commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return bloqueado;
    }

    public async Task<bool> DesbloquearHorario(InDesbloquearHorario param, int? idBarbeiro)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "D");
        parameters.Add("@DT_Bloqueio", param.DT_Bloqueio);
        parameters.Add("@HR_Inicio", param.HR_Inicio);
        parameters.Add("@HR_Fim", param.HR_Fim);
        parameters.Add("@ID_Barbeiro", idBarbeiro);

        var desbloqueado = await conexao.QueryFirstOrDefaultAsync<bool>(sql: "st_BarbeariaBloqueioAddUpd",
                                                                        param: parameters,
                                                                        commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return desbloqueado;
    }

    /// <summary>Bloqueios gerais do dia e, com profissional informado, também os dele.</summary>
    public async Task<IEnumerable<OutBloqueioHorario>> ConsultarBloqueios(DateTime data, int? idBarbeiro)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "B");
        parameters.Add("@DT_Inicial", data.Date);
        parameters.Add("@ID_Barbeiro", idBarbeiro);

        var bloqueios = await conexao.QueryAsync<OutBloqueioHorario>(sql: "st_BarbeariaAgendaConsultar",
                                                                     param: parameters,
                                                                     commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return bloqueios;
    }
}
