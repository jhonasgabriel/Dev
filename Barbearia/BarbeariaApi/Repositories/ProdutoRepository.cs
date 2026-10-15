using System.Data;
using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using Dapper;

namespace BarbeariaApi.Repositories;

public class ProdutoRepository(IConfiguration configuration) : RepositoryBase(configuration)
{
    public async Task<OutProduto> Cadastrar(InCadastrarProduto param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "I");
        parameters.Add("@NM_Produto", param.NM_Produto);
        parameters.Add("@VL_Produto", param.VL_Produto);
        parameters.Add("@NM_Marca", param.NM_Marca);
        parameters.Add("@DS_Produto", param.DS_Produto);

        var produto = await conexao.QueryFirstOrDefaultAsync<OutProduto>(sql: "st_BarbeariaProdutoAddUpd",
                                                                         param: parameters,
                                                                         commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return produto;
    }

    public async Task<IEnumerable<OutProduto>> Listar(bool incluirInativos = false)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@SN_Ativo", incluirInativos ? null : "S");

        var produtos = await conexao.QueryAsync<OutProduto>(sql: "st_BarbeariaProdutoConsultar",
                                                            param: parameters,
                                                            commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return produtos;
    }

    public async Task<OutProduto> ObterPorId(int idProduto)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ID_Produto", idProduto);

        var produto = await conexao.QueryFirstOrDefaultAsync<OutProduto>(sql: "st_BarbeariaProdutoConsultar",
                                                                         param: parameters,
                                                                         commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return produto;
    }

    /// <summary>Todos os produtos com o nome: a procedure ordena o ativo primeiro e, entre inativos, o mais recente.</summary>
    public async Task<IEnumerable<OutProduto>> ConsultarPorNome(string nome)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@NM_Produto", nome);

        var produtos = await conexao.QueryAsync<OutProduto>(sql: "st_BarbeariaProdutoConsultar",
                                                            param: parameters,
                                                            commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return produtos;
    }

    public async Task<OutProduto> ObterPorNome(string nome) => (await ConsultarPorNome(nome)).FirstOrDefault();

    public async Task<bool> ExisteComNome(string nome, int? idIgnorado = null)
        => (await ConsultarPorNome(nome)).Any(produto => produto.ID_Produto != idIgnorado);

    /// <summary>Retorna false se o produto foi removido entre o upload e o vínculo (o serviço descarta o arquivo).</summary>
    public async Task<bool> AtualizarImagem(int idProduto, string caminho)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "M");
        parameters.Add("@ID_Produto", idProduto);
        parameters.Add("@DS_Imagem", caminho);

        await conexao.ExecuteAsync(sql: "st_BarbeariaProdutoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        try
        {
            ValidarReturnCode(parameters);
            return true;
        }
        catch (ProcedureException ex) when (ex.RegraNegocio)
        {
            return false;
        }
    }

    public async Task<bool> Atualizar(int idProduto, InAtualizarProduto param)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "U");
        parameters.Add("@ID_Produto", idProduto);
        parameters.Add("@NM_Produto", param.NM_Produto);
        parameters.Add("@VL_Produto", param.VL_Produto);
        parameters.Add("@NM_Marca", param.NM_Marca);
        parameters.Add("@DS_Produto", param.DS_Produto);

        await conexao.ExecuteAsync(sql: "st_BarbeariaProdutoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return true;
    }

    /// <summary>Exclusão lógica: preserva o histórico de vendas.</summary>
    public Task<bool> Deletar(int idProduto) => AlterarStatus(idProduto, false);

    public async Task<bool> AlterarStatus(int idProduto, bool ativo)
    {
        using var conexao = Connection;
        conexao.Open();

        var parameters = new DynamicParameters();
        parameters.AdicionarReturnCodeErrMsg();
        parameters.Add("@ST_Operacao", "S");
        parameters.Add("@ID_Produto", idProduto);
        parameters.Add("@SN_Ativo", ativo ? "S" : "N");

        await conexao.ExecuteAsync(sql: "st_BarbeariaProdutoAddUpd",
                                   param: parameters,
                                   commandType: CommandType.StoredProcedure);

        ValidarReturnCode(parameters);

        return true;
    }
}
