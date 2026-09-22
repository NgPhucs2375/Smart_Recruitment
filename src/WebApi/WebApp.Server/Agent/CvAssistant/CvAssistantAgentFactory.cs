using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using WebApp.Server.Agent.CvAssistant.Tools;

namespace WebApp.Server.Agent.CvAssistant;

// Scoped factory: agent và tools dùng cùng request scope với MediatR/DbContext/user hiện tại.
internal sealed class CvAssistantAgentFactory
{
    private readonly CvQueryTools _queryTools;
    private readonly CvCommandTools _commandTools;
    private readonly IChatClient _chatClient;

    public CvAssistantAgentFactory(
        CvQueryTools queryTools,
        CvCommandTools commandTools,
        [FromKeyedServices(CvAssistantInstructions.ChatClientKey)] IChatClient chatClient)
    {
        _queryTools = queryTools;
        _commandTools = commandTools;
        _chatClient = chatClient;
    }

    public AIAgent CreateAgent()
    {
        var innerAgent = new ChatClientAgent(
            _chatClient,
            instructions: CvAssistantInstructions.SystemPrompt,
            name: CvAssistantInstructions.AgentName,
            tools:
            [
                AIFunctionFactory.Create(
                    _queryTools.GetMyProfileAsync,
                    new AIFunctionFactoryOptions { Name = "get_my_profile" }),
                AIFunctionFactory.Create(
                    _queryTools.GetCvDetailAsync,
                    new AIFunctionFactoryOptions { Name = "get_cv_detail" }),
                AIFunctionFactory.Create(
                    _commandTools.CreateCvAsync,
                    new AIFunctionFactoryOptions { Name = "create_cv" })
            ]);

        return new CvStateAgent(innerAgent);
    }
}
