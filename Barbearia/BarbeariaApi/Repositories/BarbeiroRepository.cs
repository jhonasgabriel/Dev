using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

/// <summary>Perfil do barbeiro: relatório, clientes e horários da própria agenda.</summary>
public class BarbeiroRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutRelatorioBarbeiro> Resumo(int idBarbeiro, DateTime inicio, DateTime fim)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "R");
        parameters.Add("@ID_Barbeiro", idBarbeiro);
        parameters.Add("@DT_Inicial", inicio.Date);
        parameters.Add("@DT_Final", fim.Date);

        OutRelatorioBarbeiro relatorio = null;

        // Os parâmetros OUTPUT só ficam disponíveis depois que o leitor é fechado.
        // Se a procedure falhar, ela não devolve os resultados: o erro dela tem prioridade sobre a falha de leitura.
        try
        {
            using var resultado = await conexao.QueryMultipleAsync(sql: "st_BarbeariaBarbeiroConsultar",
                                                                   param: parameters,
                                                                   commandType: CommandType.StoredProcedure);

            relatorio = new OutRelatorioBarbeiro
            {
                Resumo = await resultado.ReadSingleAsync<OutResumoBarbeiro>(),
                Servicos = (await resultado.ReadAsync<OutServicoControle>()).ToList(),
                Formas_Pagamento = (await resultado.ReadAsync<OutPagamentoControle>()).ToList()
            };
        }
        catch (InvalidOperationException)
        {
            ValidarReturnCode(parameters);
            throw;
        }

        ValidarReturnCode(parameters);

        return relatorio;
    }

    public async Task<IEnumerable<OutClienteBarbeiro>> Clientes(int idBarbeiro)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Consulta", "C");
        parameters.Add("@ID_Barbeiro", idBarbeiro);

        var clientes = await conexao.QueryAsync<OutClienteBarbeiro>(sql: "st_BarbeariaBarbeiroConsultar",
                                                                    param: parameters,
                                                                    commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return clientes;
    }

    public async Task<IEnumerable<OutHorarioBarbeiro>> Horarios(int idBarbeiro)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Barbeiro", idBarbeiro);

        var horarios = await conexao.QueryAsync<OutHorarioBarbeiro>(sql: "st_BarbeariaHorarioConsultar",
                                                                    param: parameters,
                                                                    commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return horarios;
    }

    public async Task<OutHorarioBarbeiro> ConfigurarHorario(int idBarbeiro, InConfigurarHorarios input)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Barbeiro", idBarbeiro);
        parameters.Add("@Dia_Semana", (int)input.Dia_Semana);
        parameters.Add("@HR_Abertura", input.HR_Abertura);
        parameters.Add("@HR_Fechamento", input.HR_Fechamento);
        parameters.Add("@HR_Inicio_Almoco", input.HR_Inicio_Almoco);
        parameters.Add("@HR_Fim_Almoco", input.HR_Fim_Almoco);
        parameters.Add("@SN_Ativo", input.SN_Ativo);

        var horario = await conexao.QueryFirstOrDefaultAsync<OutHorarioBarbeiro>(sql: "st_BarbeariaHorarioAddUpd",
                                                                                 param: parameters,
                                                                                 commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return horario;
    }
}
