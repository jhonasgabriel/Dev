using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using BarbeariaApi.Repositories;
using BarbeariaApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });

// A conexão com o banco é definida somente em appsettings.json (ConnectionStrings:DefaultConnection).
if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
    throw new InvalidOperationException("Configure ConnectionStrings:DefaultConnection no appsettings.json.");

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Configure Jwt:Key.");
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Configure Jwt:Key com pelo menos 32 bytes.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                if (principal?.FindFirstValue("auth_method") != "senha"
                    || !int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
                    || !int.TryParse(principal.FindFirstValue("pessoa_id"), out var pessoa)
                    || string.IsNullOrEmpty(principal.FindFirstValue("credential")))
                {
                    context.Fail("Faça login novamente com nome e senha.");
                    return;
                }

                // Inativação ou troca de senha revogam o token: a assinatura precisa conferir com o hash vigente.
                var repository = context.HttpContext.RequestServices.GetRequiredService<LoginRepository>();
                var atual = await repository.CredencialAtual(id);
                if (atual == null || atual.ID_Pessoa != pessoa || atual.TP_Usuario != principal.FindFirstValue(ClaimTypes.Role)
                    || !AssinaturaCredencial.Conferir(jwtKey, atual.DS_SenhaHash, principal.FindFirstValue("credential")))
                    context.Fail("Credencial expirada ou desativada.");
            }
        };
    });

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "local",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("React", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Autenticação
builder.Services.AddSingleton<CredenciaisService>();
builder.Services.AddScoped<LoginRepository>();
builder.Services.AddScoped<LoginService>();

// Pessoas, equipe e barbeiros
builder.Services.AddScoped<PessoaRepository>();
builder.Services.AddScoped<PessoaService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "BarbeariaApi.xml"));
});

var app = builder.Build();

app.UseMiddleware<BarbeariaApi.Middleware.RequestLoggingMiddleware>();
app.UseMiddleware<BarbeariaApi.Middleware.ExceptionMiddleware>();

// Documentação da API só em desenvolvimento: em produção não expõe rotas nem modelos.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("React");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();
