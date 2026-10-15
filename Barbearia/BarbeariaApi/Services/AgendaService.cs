using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class AgendaService
{
    private readonly AgendaRepository _repository;

    public AgendaService(AgendaRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<OutDisponibilidade>> ConsultarAgenda(InConsultarAgenda param)
    {
        var servicoIds = NormalizarServicos(param.ID_Servico);

        var hoje = ObterDataAtualBrasil();
        var max = hoje.AddDays(6);
        if (param.DT_Agendamento < DateOnly.FromDateTime(hoje) || param.DT_Agendamento > DateOnly.FromDateTime(max))
            throw new ArgumentException("Consulta permitida somente entre hoje e os próximos 7 dias.");

        param.ID_Servico = servicoIds;
        var disponibilidade = await _repository.ConsultarAgenda(param);
        var agora = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"));
        var dia = param.DT_Agendamento.ToDateTime(TimeOnly.MinValue).Date;

        // Somente horários do dia consultado que ainda não passaram.
        return disponibilidade.Where(item =>
            item.DT_Agendamento.Date == dia
            && (item.DT_Agendamento.Date > agora.Date || item.HR_Agendamento > agora.TimeOfDay));
    }

    public async Task<OutAgendamento> CadastrarAgendamento(InCadastrarAgendamento param, bool permitirForaDaJanela = false)
    {
        if (!param.ID_Pessoa.HasValue)
        {
            if (string.IsNullOrWhiteSpace(param.NM_Cliente) || string.IsNullOrWhiteSpace(param.NO_Telefone))
                throw new ArgumentException("Informe nome e telefone para realizar o agendamento.");

            PessoaService.ValidarUsuario(param.NM_Cliente, param.NO_Telefone);
            param.NM_Cliente = param.NM_Cliente.Trim();
            param.NO_Telefone = PessoaService.NormalizarTelefone(param.NO_Telefone);
        }
        if (param.ID_Pessoa <= 0)
            throw new ArgumentException("ID da pessoa inválido.");

        param.ID_Servico = NormalizarServicos(param.ID_Servico);
        param.Forma_Pagamento = "NAO_INFORMADO";

        var hoje = DateOnly.FromDateTime(ObterDataAtualBrasil());
        if (param.DT_Agendamento < hoje || (!permitirForaDaJanela && param.DT_Agendamento > hoje.AddDays(6)))
            throw new ArgumentException("Data fora do período permitido para agendamento.");

        if (param.HR_Agendamento < TimeSpan.Zero || param.HR_Agendamento >= TimeSpan.FromDays(1))
            throw new ArgumentException("Horário inválido.");

        // Pessoa, disponibilidade, preços e reserva são gravados na mesma transação da procedure.
        var ag = await _repository.CadastrarAgendamento(param);
        if (ag == null)
            throw new InvalidOperationException("Não foi possível cadastrar o agendamento.");

        return ag;
    }

    public async Task<IEnumerable<OutConsultarAgendamentos>> ConsultarAgendamentos(InConsultarAgendamentos param)
    {
        if (param.DT_Inicial == default || param.DT_Final == default)
            throw new ArgumentException("Informe o período da consulta.");

        if (param.DT_Inicial.Date > param.DT_Final.Date)
            throw new ArgumentException("A data inicial deve ser anterior ou igual à data final.");

        if (param.ID_Usuario.HasValue && param.ID_Usuario <= 0)
            throw new ArgumentException("ID da pessoa inválido.");

        return await _repository.ConsultarAgendamentos(param);
    }

    public Task CancelarAgendamento(int idAgendamento, int idPessoa)
    {
        if (idAgendamento <= 0 || idPessoa <= 0)
            throw new ArgumentException("Agendamento inválido.");

        return _repository.CancelarAgendamento(idAgendamento, idPessoa);
    }

    public async Task<OutHorario> ConfigurarHorarios(InConfigurarHorarios param)
    {
        ValidarHorarioFuncionamento(param);
        return await _repository.ConfigurarHorarios(param);
    }

    public Task<IEnumerable<OutHorario>> ConsultarHorarios() => _repository.ConsultarHorarios();

    public Task<IEnumerable<OutBloqueioHorario>> ConsultarBloqueios(DateTime data, int? idBarbeiro = null)
    {
        if (data == default)
            throw new ArgumentException("Data do bloqueio inválida.");

        return _repository.ConsultarBloqueios(data, idBarbeiro);
    }

    public async Task<bool> BloquearHorario(InBloquearHorario param, int? idBarbeiro = null)
    {
        ValidarIntervalo(param.DT_Bloqueio, param.HR_Inicio, param.HR_Fim);
        return await _repository.CadastrarBloqueio(idBarbeiro, param.DT_Bloqueio, param.HR_Inicio, param.HR_Fim, null);
    }

    public async Task<bool> DesbloquearHorario(InDesbloquearHorario param, int? idBarbeiro = null)
    {
        ValidarIntervalo(param.DT_Bloqueio, param.HR_Inicio, param.HR_Fim);
        return await _repository.DesbloquearHorario(param, idBarbeiro);
    }

    private static DateTime ObterDataAtualBrasil()
    {
        var fusoBrasil = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, fusoBrasil).Date;
    }

    private static List<int> NormalizarServicos(List<int> servicoIds)
    {
        if (servicoIds == null || servicoIds.Count == 0)
            throw new ArgumentException("Informe ao menos um serviço.");

        if (servicoIds.Any(id => id <= 0))
            throw new ArgumentException("Todos os IDs de serviço devem ser válidos.");

        return servicoIds.Distinct().ToList();
    }

    private static void ValidarHorarioFuncionamento(InConfigurarHorarios param)
    {
        if (!Enum.IsDefined(param.Dia_Semana) || param.HR_Abertura < TimeSpan.Zero || param.HR_Fechamento >= TimeSpan.FromDays(1))
            throw new ArgumentException("Dia ou horário inválido.");

        if (param.HR_Abertura >= param.HR_Fechamento)
            throw new ArgumentException("O horário de fechamento deve ser posterior ao horário de abertura.");

        var informouInicioAlmoco = param.HR_Inicio_Almoco.HasValue;
        var informouFimAlmoco = param.HR_Fim_Almoco.HasValue;
        if (informouInicioAlmoco != informouFimAlmoco)
            throw new ArgumentException("Informe o início e o fim do horário de almoço.");

        if (informouInicioAlmoco &&
            (param.HR_Inicio_Almoco >= param.HR_Fim_Almoco ||
             param.HR_Inicio_Almoco < param.HR_Abertura ||
             param.HR_Fim_Almoco > param.HR_Fechamento))
            throw new ArgumentException("O horário de almoço deve estar dentro do período de funcionamento.");
    }

    private static void ValidarIntervalo(DateTime data, TimeSpan inicio, TimeSpan fim)
    {
        if (data.Date < ObterDataAtualBrasil())
            throw new ArgumentException("Não é possível alterar bloqueios em datas passadas.");

        if (inicio >= fim)
            throw new ArgumentException("A hora final deve ser posterior à hora inicial.");

        if (inicio < TimeSpan.Zero || fim >= TimeSpan.FromDays(1))
            throw new ArgumentException("Horário inválido.");
    }
}
