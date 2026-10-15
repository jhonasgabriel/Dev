using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BarbeariaApi.Repositories;

/// <summary>
/// Base dos repositórios: conexão e validação do retorno padrão das procedures (@Return_Code / @ErrMsg).
/// </summary>
public abstract class RepositoryBase(IConfiguration configuration)
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection");

    protected SqlConnection Connection => new(_connectionString);

    /// <summary>
    /// Lança <see cref="ProcedureException"/> quando a procedure devolve @Return_Code diferente de zero.
    /// Deve ser chamado depois que o resultado foi lido (os parâmetros OUTPUT só chegam ao final da leitura).
    /// </summary>
    protected static void ValidarReturnCode(DynamicParameters parameters)
    {
        var returnCode = parameters.Get<int?>("@Return_Code") ?? 0;

        if (returnCode != 0)
            throw new ProcedureException(returnCode, parameters.Get<string>("@ErrMsg"));
    }
}

public static class DynamicParametersExtensions
{
    /// <summary>Parâmetros de retorno presentes em todas as procedures st_Barbearia*.</summary>
    public static void AdicionarReturnCodeErrMsg(this DynamicParameters parameters)
    {
        parameters.Add("@Return_Code", 0, DbType.Int32, ParameterDirection.InputOutput);
        parameters.Add("@ErrMsg", string.Empty, DbType.AnsiString, ParameterDirection.InputOutput, 255);
    }
}

/// <summary>
/// Erro devolvido por uma procedure. Return_Code 2 é regra de negócio (mensagem para o usuário, HTTP 409);
/// os demais são falhas técnicas, registradas somente no log.
/// </summary>
public sealed class ProcedureException(int returnCode, string message) : Exception(message)
{
    public int ReturnCode { get; } = returnCode;

    public bool RegraNegocio => ReturnCode == 2;
}
