using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class PessoaService
{
    private readonly PessoaRepository _pessoaRepository;

    public PessoaService(PessoaRepository pessoaRepository)
    {
        _pessoaRepository = pessoaRepository;
    }

    public async Task<OutPessoa> Cadastrar(InCadastrarPessoa param)
    {
        ValidarUsuario(param.NM_Usuario, param.NO_Telefone);
        if (param.DT_Nascimento > DateOnly.FromDateTime(DateTime.Today))
            throw new ArgumentException("Data de nascimento inválida.");

        param.NM_Usuario = param.NM_Usuario.Trim();
        param.NO_Telefone = NormalizarTelefone(param.NO_Telefone);
        return await _pessoaRepository.Cadastrar(param);
    }

    public async Task<OutPessoa> ObterOuCadastrar(InCadastrarPessoa param)
    {
        ValidarUsuario(param.NM_Usuario, param.NO_Telefone);
        param.NM_Usuario = param.NM_Usuario.Trim();
        param.NO_Telefone = NormalizarTelefone(param.NO_Telefone);

        var existente = await _pessoaRepository.ObterPorTelefone(param.NO_Telefone);
        if (existente != null)
            return existente;

        try
        {
            return await _pessoaRepository.Cadastrar(param);
        }
        catch (ProcedureException ex) when (ex.RegraNegocio)
        {
            // Protege contra dois agendamentos simultâneos com o mesmo telefone.
            existente = await _pessoaRepository.ObterPorTelefone(param.NO_Telefone);
            if (existente != null)
                return existente;

            throw;
        }
    }

    public async Task<IEnumerable<OutPessoa>> Consultar(InConsultarPessoa param)
    {
        if (!string.IsNullOrWhiteSpace(param.NO_Telefone))
            param.NO_Telefone = NormalizarTelefone(param.NO_Telefone);

        if (!string.IsNullOrWhiteSpace(param.SN_Ativo) && param.SN_Ativo is not ("S" or "N"))
            throw new ArgumentException("Status da pessoa inválido.");

        return await _pessoaRepository.Consultar(param);
    }

    /// <summary>Cliente agendado ou atendido pelo profissional (acesso do barbeiro ao cadastro).</summary>
    public async Task<bool> ClienteDoProfissional(int idPessoa, int idBarbeiro) =>
        (await _pessoaRepository.Consultar(new InConsultarPessoa { ID_Barbeiro = idBarbeiro }, idPessoa)).Any();

    public async Task<bool> Atualizar(int id, InAtualizarPessoa param)
    {
        if (id <= 0)
            throw new ArgumentException("ID da pessoa inválido.");

        ValidarUsuario(param.NM_Usuario, param.NO_Telefone);
        if (param.DT_Nascimento > DateOnly.FromDateTime(DateTime.Today))
            throw new ArgumentException("Data de nascimento inválida.");

        param.NM_Usuario = param.NM_Usuario.Trim();
        param.NO_Telefone = NormalizarTelefone(param.NO_Telefone);
        return await _pessoaRepository.Atualizar(id, param);
    }

    public async Task<bool> Deletar(int id)
    {
        return await _pessoaRepository.Deletar(id);
    }

    public async Task<bool> AlterarStatus(int id, bool ativo)
    {
        if (id <= 0)
            throw new ArgumentException("ID da pessoa inválido.");

        return await _pessoaRepository.AlterarStatus(id, ativo);
    }

    public async Task<IEnumerable<OutHistoricoPessoa>> Historico(int id)
    {
        return await _pessoaRepository.Historico(id);
    }

    public async Task<OutFrequenciaPessoa> Frequencia(int id)
    {
        return await _pessoaRepository.Frequencia(id);
    }

    public static void ValidarUsuario(string nome, string telefone)
    {
        if (string.IsNullOrWhiteSpace(nome) || string.IsNullOrWhiteSpace(telefone))
            throw new ArgumentException("Informe o nome e telefone da pessoa.");

        if (nome.Trim().Length is < 3 or > 50)
            throw new ArgumentException("Nome deve ter entre 3 e 50 caracteres.");

        NormalizarTelefone(telefone);
    }

    public static string NormalizarTelefone(string telefone)
    {
        var normalizado = new string((telefone ?? "").Where(char.IsDigit).ToArray());
        if (normalizado.Length is < 10 or > 11)
            throw new ArgumentException("Telefone deve possuir 10 ou 11 números.");

        return normalizado;
    }
}
