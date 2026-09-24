using Application;
using AGUI.Abstractions;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Shared;
using WebApp.Server.Agent;
using WebApp.Server.Extensions;
using WebApp.Server.Initializer;
using Casbin;
using Minio;

var builder = WebApplication.CreateBuilder(args);
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
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000") // Cổng dev của Vite/Next/React
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
_services.AddNpgSqlIdentityInfrastructure();
_services.AddNpgSqlPersistenceInfrastructure();
_services.AddIdentityRepositories(_config);
_services.AddPersistenceRepositories();
_services.AddSharedInfrastructure(_config);
if (_env.IsDevelopment())
{
    _services.AddSwaggerExtension();
}

_services.AddControllers().AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.PropertyNamingPolicy = null;
});
_services.AddApiVersioningExtension();
_services.AddHealthChecks();
_services.AddSignalR();
_services.AddWebAppServices();
_services.AddAdamAgents();
_services.AddHostedService<WebApp.Server.Jobs.TinTuyenDungHetHanJob>();
_services.AddHostedService<WebApp.Server.Jobs.CvImportSessionCleanupJob>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
_services.AddEndpointsApiExplorer();

// trước Build() dùng Add sau dùng Use
var app = builder.Build();
if (string.IsNullOrWhiteSpace(app.Configuration["Gemini:ApiKey"]))
{
    app.Logger.LogWarning(
        "Gemini:ApiKey chưa được khai báo - tính năng parse CV sẽ báo lỗi. "
        + "Thêm key vào appsettings.Development.json rồi restart backend.");
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
app.UseHealthChecks("/health");
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
