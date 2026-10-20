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
        // Get<string[]>() trả về null với giá trị scalar ("AllowedOrigins": "http://a"),
        // nên đọc trực tiếp chuỗi rồi tách; fallback sang children nếu khai báo dạng mảng.
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
        policy.WithOrigins(allowedOrigins) // Cổng dev của Vite/Next/React
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
// Giới hạn tần suất các endpoint gửi email (forgot-password, resend-verification,
// request-magic-link) để chống spam/abuse mail relay.
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
// X-Forwarded-For/Proto: chỉ tin proxy đã biết, tránh client giả mạo IP.
// Mặc định chỉ tin loopback (an toàn khi không có proxy). Khi chạy sau proxy
// khác, khai báo IP proxy qua env "ForwardedHeaders:KnownProxies" (';'/',' phân tách).
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
// Liveness (luôn 200 khi process sống) + readiness dependency ở /health/ready.
_services.AddSignalR();
_services.AddWebAppServices();
_services.AddAdamAgents();
_services.AddHostedService<WebApp.Server.Jobs.TinTuyenDungHetHanJob>();
_services.AddHostedService<WebApp.Server.Jobs.TinTuyenDungSangLocJob>();
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
app.UseRateLimiter();

app.UseErrorHandlingMiddleware();
app.MapHealthEndpoints();
// Map Controllers nghiệp vụ
app.MapControllers();

app.MapHub<WebApp.Server.Hubs.NotificationsHub>("/api/hubs/notifications").RequireCors("AllowFrontend");
app.MapHub<WebApp.Server.Hubs.ChatHub>("/api/hubs/chat", options => options.CloseOnAuthenticationExpiration = true).RequireCors("AllowFrontend");

// Map role=reasoning trong AG-UI history về assistant trước khi MAF parse,
// nếu không continuation run sau tool result sẽ 500 "Unknown chat role".
app.UseMiddleware<WebApp.Server.Middlewares.AguiReasoningRoleMiddleware>();

// Hạn mức 15 chat/ngày cho agent Adam — chạy trước endpoint agent, sau auth middleware.
app.UseMiddleware<WebApp.Server.Middlewares.AgentChatRateLimitMiddleware>();

// Persist lịch sử chat agent theo threadId vào Redis (sau rate-limit, trước endpoint):
// capture SSE response của run rồi lưu snapshot + run record; fail-open mọi lỗi.
app.UseMiddleware<WebApp.Server.Middlewares.AgentThreadHistoryMiddleware>();

// BE-first: một agent duy nhất ở BE (LLM + tool backend scoped, chỉ đọc).
// FE giữ frontend tool v2 (useFrontendTool/useAgentContext) và trỏ runtimeUrl về endpoint này.
// Ghi CV duy nhất qua nút "Lưu CV" ở /CV; chat từ trang khác dùng navigateToCvEditor + pending-patch.
app.MapAdamAgent("/api/copilotkit")
    .RequireCors("AllowFrontend")
    .RequireAuthorization();



await app.RunAsync();
