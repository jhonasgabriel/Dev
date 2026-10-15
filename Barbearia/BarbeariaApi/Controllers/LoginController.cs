using BarbeariaApi.Models.Input;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/login")]
public class LoginController : ControllerBase
{
    private readonly LoginService _loginService;

    public LoginController(LoginService loginService)
    {
        _loginService = loginService;
    }

    /// <summary>
    /// Realizar login
    /// </summary>
    /// <param name="param">Dados para login</param>
    /// <returns>Dados do usuário</returns>
    [HttpPost]
    [EnableRateLimiting("login")]
    public async Task<ActionResult> Login([FromBody] InLogin param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var usuario = await _loginService.Login(param);

        if (usuario == null)
            return Unauthorized(new { message = "Nome ou senha inválidos." });

        return Ok(usuario);
    }
}

