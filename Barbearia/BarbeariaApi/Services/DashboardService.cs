using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Repositories;

namespace BarbeariaApi.Services;

public class DashboardService
{
    private readonly DashboardRepository _repository;

    public DashboardService(DashboardRepository repository)
    {
        _repository = repository;
    }

    public async Task<OutDashboard> Consultar(InConsultarDashboard param)
    {
        return await _repository.Consultar(param);
    }
}
