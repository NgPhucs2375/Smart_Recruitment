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

_services.AddControllers().AddJsonOptions(opts => opts.JsonSerializerOptions.PropertyNamingPolicy = null);
_services.AddApiVersioningExtension();
_services.AddHealthChecks();
_services.AddScoped<IAuthenticatedUserService, AuthenticatedUserService>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
_services.AddEndpointsApiExplorer();





// trước Build() dùng Add sau dùng Use
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = new ApplicationInitializer(scope.ServiceProvider);
    await initializer.InitializeAsync();
}


var Agent = _services.AgentSmart();





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
app.UseAuthorization();

app.UseErrorHandlingMiddleware();
app.UseHealthChecks("/health");
// Map Controllers nghiệp vụ
app.MapControllers();
app.MapGet("/api/copilotkit/info", (HttpContext context) =>
{
    // Chặn hoàn toàn cache để trình duyệt nhận bản cập nhật mới nhất
    context.Response.Headers.Append("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    
    return Results.Content(
        """
        {
          "agents": {
            "smart-agent": {
              "name": "smart-agent",
              "description": "CV Optimizer Assistant"
            }
          },
          "actions": {}
        }
        """,
        "application/json"
    );
}).RequireCors("AllowFrontend");
app.MapAGUIServer("/api/copilotkit", Agent).RequireCors("AllowFrontend");



await app.RunAsync();
