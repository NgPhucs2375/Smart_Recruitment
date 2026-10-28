using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using WebApp.Server.Agent.Adam.Tools;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.Adam;

internal sealed class AdamAgentFactory
{
    private readonly CvQueryTools _queryTools;
    private readonly IChatClient _chatClient;
    private readonly SharedStateStore _sharedStateStore;
    private readonly ILogger<SharedStateAgent> _shareStateLogs;

    public AdamAgentFactory(
        CvQueryTools queryTools,
        [FromKeyedServices(AdamInstructions.ChatClientKey)] IChatClient chatClient,
        SharedStateStore sharedStateStore,
        ILogger<SharedStateAgent> shareStateLogs)
    {
        _queryTools = queryTools;
        _chatClient = chatClient;
        _sharedStateStore = sharedStateStore;
        _shareStateLogs = shareStateLogs;
    }

    public AIAgent CreateAgent()
    {
        var tools = new List<AITool>
        {
            AIFunctionFactory.Create(_queryTools.GetMyProfileAsync, new AIFunctionFactoryOptions { Name = "get_my_profile" }),
            AIFunctionFactory.Create(_queryTools.GetCvDetailAsync, new AIFunctionFactoryOptions { Name = "get_cv_detail" }),
            AIFunctionFactory.Create(_queryTools.GetMyCvsAsync, new AIFunctionFactoryOptions { Name = "list_my_cvs" }),
            AIFunctionFactory.Create(_queryTools.SuggestJobsForMyCvAsync, new AIFunctionFactoryOptions { Name = "suggest_jobs_for_my_cv" }),
            AIFunctionFactory.Create(_queryTools.SuggestCvThemeAsync, new AIFunctionFactoryOptions { Name = "suggest_cv_theme" }),
        };

        var chatAgent = new ChatClientAgent(
            _chatClient,
            new ChatClientAgentOptions
            {
                Name = AdamInstructions.AgentName,
                Description = "Trợ lý global về CV và hồ sơ ứng viên.",
                ChatOptions = new ChatOptions
                {
                    Instructions = AdamInstructions.SystemPrompt,
                    Temperature = 0.1f,
                    MaxOutputTokens = 4096,
                    AllowMultipleToolCalls = false,
                    Reasoning = new ReasoningOptions
                    {
                        Effort = ReasoningEffort.None,
                        Output = ReasoningOutput.None
                    },
                    Tools = tools
                }
            },
            loggerFactory: null,
            services: null);

        // boc agent qua SharedStateAgent de luc nao cung hydrate va publish state no sync voi FE
        return new SharedStateAgent(
            chatAgent,
            _sharedStateStore,
            _shareStateLogs);
    }
}
