using Application;
using AGUI.Abstractions;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Shared;
using WebApp.Server.Agent;
using WebApp.Server.Extensions;
using WebApp.Server.Initializer;
using WebApp.Server.Health;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using System.Threading.RateLimiting;
using Minio;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAGUIServer();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(
        0, AGUIJsonUtilities.DefaultTypeInfoResolver);
});
var _config = builder.Configuration;
var _services = builder.Services;
var _env = builder.Environment;


_services.AddCors(options =>
{
        var rawOrigins = _config["Frontend:AllowedOrigins"];
        var originEntries = !string.IsNullOrWhiteSpace(rawOrigins)
            ? new[] { rawOrigins }
            : _config.GetSection("Frontend:AllowedOrigins").GetChildren()
                .Select(c => c.Value ?? string.Empty)
                .ToArray();
        var configuredOrigins = originEntries
            .SelectMany(o => o.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    string[] allowedOrigins;
    if (_env.IsDevelopment())
    {
        allowedOrigins = new[] { "http://localhost:3000", "http://127.0.0.1:3000" }
            .Concat(configuredOrigins)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
    else
    {
        if (configuredOrigins.Length == 0)
            throw new InvalidOperationException(
                "Frontend:AllowedOrigins is required in Production. " +
                "Set the Frontend__AllowedOrigins environment variable (origins separated by ';').");
        allowedOrigins = configuredOrigins;
    }

    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins) 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

_services.AddEnvironmentVariablesExtension();
_services.AddIdentityLayer();
_services.AddApplicationLayer();
_services.AddNpgSqlIdentityInfrastructure(_config);
_services.AddNpgSqlPersistenceInfrastructure(_config);
_services.AddIdentityRepositories(_config);
_services.AddPersistenceRepositories();
_services.AddSharedInfrastructure(_config);
_services.AddRedisInfrastructure(_config);
_services.AddHealthChecks()
    .AddCheck<MinioHealthCheck>("object-storage", tags: ["ready"])
    .AddCheck<AiProviderHealthCheck>("ai-provider", tags: ["telemetry"]);
if (_env.IsDevelopment())
{
    _services.AddSwaggerExtension();
}

_services.AddControllers().AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.PropertyNamingPolicy = null;
});
_services.AddApiVersioningExtension();
_services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth-mail", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});
_services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    var knownProxies = _config["ForwardedHeaders:KnownProxies"];
    if (!string.IsNullOrWhiteSpace(knownProxies))
    {
        options.KnownProxies.Clear();
        foreach (var entry in knownProxies.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (System.Net.IPAddress.TryParse(entry, out var proxy)) options.KnownProxies.Add(proxy);
        }
    }
});
_services.AddSignalR();
_services.AddWebAppServices();
_services.AddAdamAgents();
_services.AddHostedService<WebApp.Server.Jobs.TinTuyenDungHetHanJob>();
_services.AddHostedService<WebApp.Server.Jobs.TinTuyenDungSangLocJob>();
_services.AddHostedService<WebApp.Server.Jobs.CvImportSessionCleanupJob>();
_services.AddEndpointsApiExplorer();

// trước Build() dùng Add sau dùng Use
var app = builder.Build();

var portEnv = Environment.GetEnvironmentVariable("PORT");
if (int.TryParse(portEnv, out var configuredPort) && configuredPort > 0 && configuredPort <= 65535)
{
    app.Urls.Clear();
    app.Urls.Add($"http://0.0.0.0:{configuredPort}");
    app.Logger.LogInformation("Backend lắng nghe trên 0.0.0.0:{Port} (biến môi trường PORT).", configuredPort);
}
else if (string.IsNullOrWhiteSpace(app.Configuration["URLS"]))
{
    app.Urls.Clear();
    app.Urls.Add("http://0.0.0.0:8080");
    app.Logger.LogInformation("PORT/ASPNETCORE_URLS chưa cấu hình — fallback 0.0.0.0:8080.");
}

app.UseForwardedHeaders();

if (!string.IsNullOrWhiteSpace(portEnv) &&
    (!int.TryParse(portEnv, out var _parsedPort) || _parsedPort <= 0 || _parsedPort > 65535))
{
    app.Logger.LogWarning("Biến môi trường PORT có giá trị không hợp lệ ('{PortValue}') — đã bỏ qua.", portEnv);
}

if (string.IsNullOrWhiteSpace(app.Configuration["Gemini:ApiKey"]))
{
    app.Logger.LogWarning(
        "Gemini:ApiKey chưa được khai báo - tính năng parse CV sẽ báo lỗi. "
        + "Thêm biến môi trường Gemini__ApiKey (local: appsettings.Development.json) rồi restart backend.");
}
if (app.Environment.IsProduction())
{
    using var storageValidationScope = app.Services.CreateScope();
    storageValidationScope.ServiceProvider.GetRequiredService<IMinioClient>();
}
using (var scope = app.Services.CreateScope())
{
    var initializer = new ApplicationInitializer(scope.ServiceProvider);
    await initializer.InitializeAsync();
}

if (_env.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwaggerExtension();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}


app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.UseErrorHandlingMiddleware();
app.MapHealthEndpoints();
app.MapControllers();

app.MapHub<WebApp.Server.Hubs.NotificationsHub>("/api/hubs/notifications").RequireCors("AllowFrontend");
app.MapHub<WebApp.Server.Hubs.ChatHub>("/api/hubs/chat", options => options.CloseOnAuthenticationExpiration = true).RequireCors("AllowFrontend");

app.UseMiddleware<WebApp.Server.Middlewares.AguiReasoningRoleMiddleware>();

app.UseMiddleware<WebApp.Server.Middlewares.AgentChatRateLimitMiddleware>();

app.UseMiddleware<WebApp.Server.Middlewares.AgentThreadHistoryMiddleware>();

app.MapAdamAgent("/api/copilotkit")
    .RequireCors("AllowFrontend")
    .RequireAuthorization();



await app.RunAsync();
