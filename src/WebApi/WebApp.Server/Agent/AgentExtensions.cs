using System;
using System.ClientModel;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI;
using WebApp.Server.Agent.Adam;
using WebApp.Server.Agent.Adam.Tools;
using WebApp.Server.Agent.RecommenAdam;
using WebApp.Server.Agent.RecommenAdam.Candidate;
using WebApp.Server.Agent.RecommenAdam.Recruiter;
using WebApp.Server.Agent.RecommenAdam.Recruiter.Tools;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent;
/// <summary>
/// DI for the global Adam assistant and the Recommen-Adam recommendation domain.
/// </summary>
public static class AgentExtensions
{
    public static IServiceCollection AddAdamAgents(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<SharedStateStore>();

        services.AddKeyedSingleton<IChatClient>(
            AdamInstructions.ChatClientKey,
            (serviceProvider, _) =>
            {
                // Endpoint/Model đọc từ cấu hình để chạy được cả 2 môi trường:
                // - dotnet run local: mặc định http://localhost:20128/v1 + Ahihi (9Router ở host).
                // - docker backend: override bằng Ai__Endpoint=http://host.docker.internal:20128/v1
                //   (localhost của container != host, và 9router ở network khác).
                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                // Chấp nhận cả 2 tên: Groq:ApiKey (env Groq__ApiKey, chuẩn của dự án)
                // và GROQ_API_KEY (tương thích docker-compose local hiện tại).
                var apiKey = GetGroqApiKey(configuration);
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
        services.AddScoped<AdamAgentFactory>();
        services.AddSingleton<ScopedAdamAgent>();

        services.AddKeyedSingleton<IChatClient>(
            CandidateAdamInstructions.ChatClientKey,
            (serviceProvider, _) =>
            {
                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                var apiKey = GetGroqApiKey(configuration);
                var clientOptions = new OpenAIClientOptions
                {
                    Endpoint = new Uri(configuration["Ai:Endpoint"] ?? "http://localhost:20128/v1")
                };
                return new OpenAIClient(new ApiKeyCredential(apiKey), clientOptions)
                    .GetChatClient(configuration["Ai:Model"] ?? "Ahihi")
                    .AsIChatClient();
            });
        services.AddScoped<RecruiterTools>();
        services.AddScoped<CandidateTools>();
        services.AddScoped<CandidateAdamAgentFactory>();
        services.AddScoped<RecruiterAdamAgentFactory>();
        services.AddSingleton<ScopedRecommenAdamAgent>();

        return services;
    }

    private static string GetGroqApiKey(IConfiguration configuration)
    {
        var apiKey = configuration["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");

        return !string.IsNullOrWhiteSpace(apiKey)
            ? apiKey
            : throw new InvalidOperationException(
                "Chưa khai báo Groq API key. Set Groq__ApiKey (hoặc GROQ_API_KEY).");
    }

    public static IEndpointConventionBuilder MapAdamAgent(
        this IEndpointRouteBuilder endpoints,
        string pattern)
    {
        var agent = endpoints.ServiceProvider.GetRequiredService<ScopedRecommenAdamAgent>();
        return endpoints.MapAGUIServer(pattern, agent);
    }
}
