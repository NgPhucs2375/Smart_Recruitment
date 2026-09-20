using System;
using System.ClientModel;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI;
using WebApp.Server.Agent.CvAssistant;
using WebApp.Server.Agent.CvAssistant.Tools;

namespace WebApp.Server.Extensions;

public static class AgentExtensions
{
    public static IServiceCollection AddCvAssistantAgent(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        services.AddKeyedSingleton<IChatClient>(
            CvAssistantInstructions.ChatClientKey,
            (serviceProvider, _) =>
            {
                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                // Chấp nhận cả 2 tên: Groq:ApiKey (env Groq__ApiKey, chuẩn của dự án)
                // và GROQ_API_KEY (tương thích docker-compose local hiện tại).
                var apiKey = configuration["Groq:ApiKey"]
                    ?? Environment.GetEnvironmentVariable("GROQ_API_KEY")
                    ?? throw new InvalidOperationException(
                        "Chưa khai báo Groq API key. Set Groq__ApiKey (hoặc GROQ_API_KEY).");
                var clientOptions = new OpenAIClientOptions
                {
                    Endpoint = new Uri("https://omniroute.operamind.one/v1")
                };

                return new OpenAIClient(new ApiKeyCredential(apiKey), clientOptions)
                    .GetChatClient("gpt")
                    .AsIChatClient();
            });

        services.AddScoped<CvQueryTools>();
        services.AddScoped<CvCommandTools>();
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
