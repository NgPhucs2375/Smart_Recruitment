using Application;
using Application.Interfaces;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Shared;
using WebApp.Server.Extensions;
using WebApp.Server.Initializer;
using WebApp.Server.Services;
using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using OpenAI;
using OpenAI.Chat;
using System.ClientModel;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http.Json;
using Casbin;

DotNetEnv.Env.Load(); 

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAGUIServer();
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
    opts.JsonSerializerOptions.TypeInfoResolverChain.Add(SmartAgentSerializerContext.Default);
});
_services.AddApiVersioningExtension();
_services.AddHealthChecks();
_services.AddSignalR();
_services.AddScoped<IAuthenticatedUserService, AuthenticatedUserService>();
_services.AddScoped<ICurrentNguoiDungService,CurrentNguoiDungService>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
_services.AddEndpointsApiExplorer();

// trước Build() dùng Add sau dùng Use
var app = builder.Build();
var jsonOptions = app.Services.GetRequiredService<IOptions<JsonOptions>>();
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

app.MapAGUIServer("/api/copilotkit", AIAgentExtension.CreateSmartAgent(jsonOptions.Value.SerializerOptions)).RequireCors("AllowFrontend");



await app.RunAsync();