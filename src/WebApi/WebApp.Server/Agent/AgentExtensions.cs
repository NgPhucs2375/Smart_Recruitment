using System;
using System.ClientModel;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI;
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

        // P1: cache kết quả tool theo user (agent:tool:{userId}:{tool}:{hash})
        // + hạn mức chat 15 câu/ngày (Redis INCR) cho endpoint /api/copilotkit.
        services.AddScoped<Cache.AgentToolCache>();
        services.AddScoped<RateLimit.AgentChatDailyLimiter>();
        services.AddScoped<Middlewares.AgentChatRateLimitMiddleware>();

        // Lịch sử chat agent theo threadId lưu ở Redis (shared store):
        // persist mỗi run qua middleware, đọc qua /api/agent/threads (AgentThreadsController).
        services.AddScoped<Threads.AgentThreadStore>();
        services.AddScoped<Middlewares.AgentThreadHistoryMiddleware>();

        services.AddScoped<CvQueryTools>();

        services.AddKeyedSingleton<IChatClient>(
            CandidateAdamInstructions.ChatClientKey,
            (serviceProvider, _) =>
            {
                var configuration = serviceProvider.GetRequiredService<IConfiguration>();
                return CreateDeepSeekChatClient(configuration);
            });
        services.AddScoped<RecruiterTools>();
        services.AddScoped<CandidateTools>();
        services.AddScoped<CandidateAdamAgentFactory>();
        services.AddScoped<RecruiterAdamAgentFactory>();
        services.AddSingleton<ScopedRecommenAdamAgent>();

        return services;
    }

    private static IChatClient CreateDeepSeekChatClient(IConfiguration configuration)
    {
        var apiKey = configuration["DeepSeek:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            apiKey = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException(
                "Chưa khai báo DeepSeek API key. Set DeepSeek__ApiKey (hoặc DEEPSEEK_API_KEY).");

        var endpoint = configuration["DeepSeek:Endpoint"];
        if (string.IsNullOrWhiteSpace(endpoint))
            endpoint = "https://api.deepseek.com/v1";
        var model = configuration["DeepSeek:Model"] ?? "deepseek-flash";

        return new OpenAIClient(
                new ApiKeyCredential(apiKey),
                new OpenAIClientOptions { Endpoint = new Uri(endpoint.TrimEnd('/') + "/") })
            .GetChatClient(model)
            .AsIChatClient();
    }

    /// <summary>
    /// Map endpoint AG-UI cho Trợ lý Global Adam (quản lí CV, hồ sơ ứng viên).
    /// </summary>
    /// <param name="endpoints"></param>
    /// <param name="pattern"></param>
    /// <returns></returns>
    public static IEndpointConventionBuilder MapAdamAgent(
        this IEndpointRouteBuilder endpoints,
        string pattern)
    {
        var agent = endpoints.ServiceProvider.GetRequiredService<ScopedRecommenAdamAgent>();
        return endpoints.MapAGUIServer(pattern, agent);
    }
}
