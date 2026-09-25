using Application;
using AGUI.Abstractions;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Shared;
using WebApp.Server.Agent;
using WebApp.Server.Extensions;
using WebApp.Server.Initializer;
using WebApp.Server.Health;
using Casbin;
using Minio;

var builder = WebApplication.CreateBuilder(args);
// Serilog dùng chung lifecycle của host (đọc section "Serilog" trong appsettings).
// Host tự flush log khi shutdown — không tự tạo logger riêng trong Initializer.
builder.Services.AddAGUIServer();
// Trên net10, endpoint AG-UI serialize event qua Http.Json.JsonOptions nhưng rule
// WhenWritingNull của AGUI context không theo resolver vào options này, nên
// TOOL_CALL_RESULT phát "role": null khiến @ag-ui/client (zod) từ chối event.
// DefaultTypeInfoResolver gắn rule omit-null vào metadata type AGUI; register sau
// AddAGUIServer và Insert(0) để nó được hỏi trước context trần trong resolver chain.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(
        0, AGUIJsonUtilities.DefaultTypeInfoResolver);
});
var _config = builder.Configuration;
var _services = builder.Services;
var _env = builder.Environment;
// Add services to the container.


_services.AddCors(options =>
{
    // Production: chỉ cho phép origin cấu hình rõ ràng qua
    // Frontend:AllowedOrigins (env Frontend__AllowedOrigins, phân tách bằng ';').
    // Development: giữ localhost + origin bổ sung nếu có.
    var configuredOrigins = _config.GetSection("Frontend:AllowedOrigins").Get<string[]>()
        ?.SelectMany(o => o.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        .Where(o => !string.IsNullOrWhiteSpace(o))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray() ?? Array.Empty<string>();

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
        policy.WithOrigins(allowedOrigins) // Cổng dev của Vite/Next/React
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

_services.AddSingleton(opts=>
{
    var env = opts.GetRequiredService<IWebHostEnvironment>();
    return new Enforcer(
        Path.Combine(env.WebRootPath,"model.conf"),
        Path.Combine(env.WebRootPath,"policy.csv")
    );
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
// Liveness (luôn 200 khi process sống) + readiness dependency ở /health/ready.
_services.AddSignalR();
_services.AddWebAppServices();
_services.AddAdamAgents();
_services.AddHostedService<WebApp.Server.Jobs.TinTuyenDungHetHanJob>();
_services.AddHostedService<WebApp.Server.Jobs.CvImportSessionCleanupJob>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
_services.AddEndpointsApiExplorer();

// trước Build() dùng Add sau dùng Use
var app = builder.Build();

// Thứ tự ưu tiên endpoint lắng nghe: PORT hợp lệ → ASPNETCORE_URLS hiện có → fallback 8080.
// Chỉ duy nhất một endpoint được cấu hình để tránh xung đột listener.
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
// Ngược lại: giữ nguyên ASPNETCORE_URLS hiện có (vd. Docker Compose local http://+:8080).

// Áp dụng X-Forwarded-For/Proto từ reverse proxy TRƯỚC mọi middleware khác.
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
// Fail-fast sớm khi cấu hình object storage production thiếu/sai: MinioClient.Build()
// không gọi mạng, chỉ validate Endpoint/Credentials/BucketName.
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

// Configure the HTTP request pipeline.
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


// app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseErrorHandlingMiddleware();
app.MapHealthEndpoints();
// Map Controllers nghiệp vụ
app.MapControllers();

app.MapHub<WebApp.Server.Hubs.NotificationsHub>("/api/hubs/notifications").RequireCors("AllowFrontend");
app.MapHub<WebApp.Server.Hubs.ChatHub>("/api/hubs/chat").RequireCors("AllowFrontend");

// Map role=reasoning trong AG-UI history về assistant trước khi MAF parse,
// nếu không continuation run sau tool result sẽ 500 "Unknown chat role".
app.UseMiddleware<WebApp.Server.Middlewares.AguiReasoningRoleMiddleware>();

// BE-first: một agent duy nhất ở BE (LLM + tool backend scoped, chỉ đọc).
// FE giữ frontend tool v2 (useFrontendTool/useAgentContext) và trỏ runtimeUrl về endpoint này.
// Ghi CV duy nhất qua nút "Lưu CV" ở /CV; chat từ trang khác dùng navigateToCvEditor + pending-patch.
app.MapAdamAgent("/api/copilotkit")
    .RequireCors("AllowFrontend")
    .RequireAuthorization();



await app.RunAsync();
