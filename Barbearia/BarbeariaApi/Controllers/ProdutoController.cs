using BarbeariaApi.Models.Input;
using BarbeariaApi.Models.Output;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarbeariaApi.Controllers;

[ApiController]
[Route("api/produtos")]
[Authorize]
public class ProdutoController : ControllerBase
{
    private readonly ProdutoService _produtoService;

    public ProdutoController(ProdutoService produtoService)
    {
        _produtoService = produtoService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Cadastrar([FromBody] InCadastrarProduto param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var produto = await _produtoService.Cadastrar(param);
        return StatusCode(StatusCodes.Status201Created, produto);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Listar([FromQuery] bool incluirInativos = false)
    {
        if (incluirInativos && !User.IsInRole("Admin"))
            return Forbid();

        var list = await _produtoService.Listar(incluirInativos);
        return Ok(list);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] InAtualizarProduto param)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ok = await _produtoService.Atualizar(id, param);
        if (!ok)
            return NotFound();

        return NoContent();
    }

    [HttpPost("{id}/imagem")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> SalvarImagem(int id, IFormFile imagem)
    {
        var produto = await _produtoService.SalvarImagem(id, imagem);
        return Ok(produto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deletar(int id)
    {
        var ok = await _produtoService.Deletar(id);
        if (!ok)
            return NotFound();

        return NoContent();
    }

    [HttpPatch("{id}/ativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Ativar(int id) =>
        await _produtoService.AlterarStatus(id, true) ? NoContent() : NotFound();

    [HttpPatch("{id}/inativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Inativar(int id) =>
        await _produtoService.AlterarStatus(id, false) ? NoContent() : NotFound();
}
