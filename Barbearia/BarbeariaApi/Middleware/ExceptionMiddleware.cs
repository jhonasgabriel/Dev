using System.Text.Json;
using BarbeariaApi.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace BarbeariaApi.Middleware;

public class ExceptionMiddleware
{
    // 50000: regra de negócio lançada pelas procedures (RAISERROR/THROW).
    private const int ErroNegocio = 50000;
    private static readonly int[] ErrosUnicidade = [2601, 2627];
    private static readonly int[] ErrosConcorrencia = [1205, 1222];
    // Timeout, servidor inacessível, banco indisponível ou login recusado.
    private static readonly int[] ErrosConexao = [-2, -1, 2, 53, 4060, 18456];

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var requestId = context.TraceIdentifier;
            // Regra de negócio recusada é resposta esperada (409): aviso sem stack trace; o resto é erro.
            if (ex is ProcedureException { RegraNegocio: true } or SqlException { Number: ErroNegocio })
            {
                _logger.LogWarning(
                    "Regra de negócio ({RequestId}) em {Path}: {Mensagem}",
                    requestId, context.Request.Path, ex.Message);
            }
            else
            {
                _logger.LogError(
                    ex, "Erro não tratado ({RequestId}) em {Path}",
                    requestId, context.Request.Path);
            }

            context.Response.Headers["X-Request-ID"] = requestId;
            context.Response.StatusCode = ex switch
            {
                ArgumentException => StatusCodes.Status400BadRequest,
                InvalidOperationException => StatusCodes.Status409Conflict,
                ProcedureException { RegraNegocio: true } => StatusCodes.Status409Conflict,
                SqlException { Number: ErroNegocio } => StatusCodes.Status409Conflict,
                SqlException sql when ErrosUnicidade.Contains(sql.Number) => StatusCodes.Status409Conflict,
                SqlException sql when ErrosConcorrencia.Contains(sql.Number) => StatusCodes.Status409Conflict,
                SqlException { Number: 547 } => StatusCodes.Status409Conflict,
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException => StatusCodes.Status403Forbidden,
                SqlException sql when ErrosConexao.Contains(sql.Number) => StatusCodes.Status503ServiceUnavailable,
                _ => StatusCodes.Status500InternalServerError
            };
            context.Response.ContentType = "application/json";

            // Mensagens internas do banco (nomes de constraints, tabelas) nunca são expostas.
            var message = ex switch
            {
                ArgumentException or InvalidOperationException => ex.Message,
                KeyNotFoundException => ex.Message,
                // Return_Code 2 traz mensagem para o usuário; demais códigos (falha técnica) ficam só no log.
                ProcedureException { RegraNegocio: true } => ex.Message,
                SqlException { Number: ErroNegocio } => ex.Message,
                SqlException sql when ErrosConcorrencia.Contains(sql.Number)
                    => "Outra operação alterou estes dados. Atualize e tente novamente.",
                SqlException sql when ErrosUnicidade.Contains(sql.Number) => "Já existe um cadastro com esses dados.",
                SqlException { Number: 547 } => "Os dados informados violam uma regra de integridade.",
                SqlException sql when ErrosConexao.Contains(sql.Number)
                    => "Banco de dados indisponível. Verifique se o SQL Server está iniciado.",
                _ => "Ocorreu um erro interno no servidor."
            };
            var result = JsonSerializer.Serialize(new { message, requestId });

            await context.Response.WriteAsync(result);
        }
    }
}
