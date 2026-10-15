using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BarbeariaApi.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.TraceIdentifier;
        _logger.LogInformation("Request {RequestId} {Method} {Path}", requestId, context.Request.Method, context.Request.Path);

        await _next(context);

        _logger.LogInformation("Response {RequestId} {StatusCode}", requestId, context.Response.StatusCode);
    }
}
