using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using RecruitmentAgent.AgentFactories;
using RecruitmentAgent.ChatClients;
using RecruitmentAgent.Common.Interfaces;
using RecruitmentAgent.Services;

namespace RecruitmentAgent;

/// <summary>
/// DI wiring for the agent layer. Mirrors the composition root part of
/// form-filling <c>agent/Program.cs</c> MINUS everything Minimal-API:
/// no <c>AddAGUI</c>, no <c>MapEndpoints</c>, no <c>EndpointGroupBase</c>.
/// Call <c>services.AddRecruitmentAgent()</c> in
/// <c>WebApp.Server/Program.cs</c>, then keep using <c>MapAGUIServer</c> +
/// Controllers as today.
/// </summary>
public static class AgentRegistration
{
    public static IServiceCollection AddRecruitmentAgent(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        // Chat client: Ollama API default (local or remote Ollama server).
        // Swap to OpenAIChatClientImpl via config when needed.
        services.TryAddSingleton<IChatClient, OllamaChatClientImpl>();

        // Expose the configured JsonSerializerOptions so factories can inject it
        // (same pattern as form-filling Program.cs).
        services.TryAddSingleton(sp =>
            sp.GetRequiredService<IOptions<JsonOptions>>().Value.SerializerOptions);

        // Document parsing (Strategy pattern, same contract as form-filling).
        services.AddSingleton<IDocumentParserStrategy, PlainTextParserStrategy>();

        // Embeddings: null-object until Ollama/pgvector is wired (see EmbeddingService.cs).
        services.AddSingleton<IEmbeddingService, NullEmbeddingService>();

        // Knowledge over the existing Clean-Architecture DbContext (no new tables).
        services.AddScoped<ICvKnowledgeService, CvKnowledgeService>();

        // Agent factories (DI injects all dependencies automatically).
        services.TryAddSingleton<IAgentFactory, CvMatchingAgentFactory>();

        return services;
    }
}
