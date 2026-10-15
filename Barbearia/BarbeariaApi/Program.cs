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

app.MapControllers();

app.Run();
