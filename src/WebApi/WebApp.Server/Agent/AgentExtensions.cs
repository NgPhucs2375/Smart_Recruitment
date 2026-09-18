using System.ClientModel;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI;
using WebApp.Server.Agent.CvAssistant;
using WebApp.Server.Agent.CvAssistant.Tools;

namespace WebApp.Server.Extensions;

/// <summary>
/// DI for CvAssistantAgent
/// </summary>
public static class AgentExtensions
{
    public static IServiceCollection AddCvAssistantAgent(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        services.AddKeyedSingleton<IChatClient>(
            CvAssistantInstructions.ChatClientKey,
            (serviceProvider, _) =>
            {
                // Endpoint/Model đọc từ cấu hình để chạy được cả 2 môi trường:
                // - dotnet run local: mặc định http://localhost:20128/v1 + Ahihi (9Router ở host).
                // - docker backend: override bằng Ai__Endpoint=http://host.docker.internal:20128/v1
                //   (localhost của container != host, và 9router ở network khác).
                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                var apiKey = configuration["Groq:ApiKey"]
                    ?? throw new InvalidOperationException(
                        "Chưa khai báo Groq:ApiKey trong appsettings.Development.json!");
                var clientOptions = new OpenAIClientOptions
                {
                    Endpoint = new Uri(
                        configuration["Ai:Endpoint"] ?? "http://localhost:20128/v1")
                };

                return new OpenAIClient(new ApiKeyCredential(apiKey), clientOptions)
                    .GetChatClient(configuration["Ai:Model"] ?? "Ahihi")
                    .AsIChatClient();
            });

        // lifetime of that request to complete that request =  Scoped<>();
        // lifetime at server startup to shutdown = Singleton<>();
        services.AddScoped<CvQueryTools>();
        services.AddScoped<CvAssistantAgentFactory>();
        services.AddSingleton<ScopedCvAssistantAgent>();

        return services;
    }

    public static IEndpointConventionBuilder MapCvAssistantAgent(
        this IEndpointRouteBuilder endpoints,
        string pattern)
    {
        var agent = endpoints.ServiceProvider.GetRequiredService<ScopedCvAssistantAgent>();
        return endpoints.MapAGUIServer(pattern, agent);
    }
}
