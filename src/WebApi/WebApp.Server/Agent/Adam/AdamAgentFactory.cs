using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using WebApp.Server.Agent.Adam.Tools;

namespace WebApp.Server.Agent.Adam;

internal sealed class AdamAgentFactory
{
    private readonly CvQueryTools _queryTools;
    private readonly IChatClient _chatClient;

    public AdamAgentFactory(
        CvQueryTools queryTools,
        [FromKeyedServices(AdamInstructions.ChatClientKey)] IChatClient chatClient)
    {
        _queryTools = queryTools;
        _chatClient = chatClient;
    }

    public AIAgent CreateAgent() => new ChatClientAgent(
        _chatClient,
        instructions: AdamInstructions.SystemPrompt,
        name: AdamInstructions.AgentName,
        tools:
        [
            AIFunctionFactory.Create(_queryTools.GetMyProfileAsync, new AIFunctionFactoryOptions { Name = "get_my_profile" }),
            AIFunctionFactory.Create(_queryTools.GetCvDetailAsync, new AIFunctionFactoryOptions { Name = "get_cv_detail" }),
            AIFunctionFactory.Create(_queryTools.GetMyCvsAsync, new AIFunctionFactoryOptions { Name = "list_my_cvs" }),
            AIFunctionFactory.Create(_queryTools.SuggestJobsForMyCvAsync, new AIFunctionFactoryOptions { Name = "suggest_jobs_for_my_cv" }),
        ]);
}
