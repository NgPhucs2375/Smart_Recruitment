using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace WebApp.Server.Agent.RecommenAdam.Recruiter;

internal sealed class RecruiterAdamAgentFactory
{
    private readonly Tools.RecruiterTools _tools;
    private readonly IChatClient _chatClient;

    public RecruiterAdamAgentFactory(
        Tools.RecruiterTools tools,
        [FromKeyedServices(RecruiterAdamInstructions.ChatClientKey)] IChatClient chatClient)
    {
        _tools = tools;
        _chatClient = chatClient;
    }

    public AIAgent CreateAgent() => new ChatClientAgent(
        _chatClient,
        instructions: RecruiterAdamInstructions.SystemPrompt,
        name: RecruiterAdamInstructions.AgentName,
        tools:
        [
            AIFunctionFactory.Create(_tools.GetCandidateRecommendationsForJobAsync, new AIFunctionFactoryOptions { Name = "get_candidate_recommendations_for_job" }),
            AIFunctionFactory.Create(_tools.GetMyRecruitmentJobsAsync, new AIFunctionFactoryOptions { Name = "get_my_recruitment_jobs" }),
            AIFunctionFactory.Create(_tools.GetCurrentRecruitmentContextAsync, new AIFunctionFactoryOptions { Name = "get_current_recruitment_context" }),
            AIFunctionFactory.Create(_tools.GetRecruitmentJobDetailAsync, new AIFunctionFactoryOptions { Name = "get_recruitment_job_detail" }),
        ]);
}
