using System.Data;
using BarbeariaApi.Models;
using Dapper;

namespace BarbeariaApi.Repositories;

public class LoginRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    /// <summary>
    /// Credencial ativa (Admin/Barbeiro) do nome digitado na tela. A senha é conferida pelo CredenciaisService
    /// somente contra o hash desta mesma pessoa.
    /// </summary>
    public async Task<UsuarioAutenticacao> ObterCredencial(string nome)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "L");
        parameters.Add("@NM_Pessoa", nome);

        var credencial = await conexao.QueryFirstOrDefaultAsync<UsuarioAutenticacao>(sql: "st_BarbeariaLogin",
                                                                                     param: parameters,
                                                                                     commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return credencial;
    }

    /// <summary>Credencial atual do usuário do token; nula quando inativo ou sem senha.</summary>
    public async Task<UsuarioAutenticacao> CredencialAtual(int idUsuario)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "V");
        parameters.Add("@ID_Usuario", idUsuario);

        var credencial = await conexao.QueryFirstOrDefaultAsync<UsuarioAutenticacao>(sql: "st_BarbeariaLogin",
                                                                                     param: parameters,
                                                                                     commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return credencial;
    }
}
