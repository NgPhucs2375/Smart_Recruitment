using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using WebApp.Server.Agent.Adam.Tools;

namespace WebApp.Server.Agent.RecommenAdam.Candidate;

internal sealed class CandidateAdamAgentFactory
{
    private readonly CvQueryTools _cvQueryTools;
    private readonly CandidateTools _candidateTools;
    private readonly IChatClient _chatClient;

    public CandidateAdamAgentFactory(
        CvQueryTools cvQueryTools,
        CandidateTools candidateTools,
        [FromKeyedServices(CandidateAdamInstructions.ChatClientKey)] IChatClient chatClient)
    {
        _cvQueryTools = cvQueryTools;
        _candidateTools = candidateTools;
        _chatClient = chatClient;
    }

    public AIAgent CreateAgent() => new ChatClientAgent(
        _chatClient,
        instructions: CandidateAdamInstructions.SystemPrompt,
        name: CandidateAdamInstructions.AgentName,
        tools:
        [
            AIFunctionFactory.Create(_cvQueryTools.GetMyProfileAsync, new AIFunctionFactoryOptions { Name = "get_my_profile" }),
            AIFunctionFactory.Create(_cvQueryTools.GetCvDetailAsync, new AIFunctionFactoryOptions { Name = "get_cv_detail" }),
            AIFunctionFactory.Create(_cvQueryTools.GetMyCvsAsync, new AIFunctionFactoryOptions { Name = "list_my_cvs" }),
            AIFunctionFactory.Create(_cvQueryTools.SuggestJobsForMyCvAsync, new AIFunctionFactoryOptions { Name = "suggest_jobs_for_my_cv" }),
            AIFunctionFactory.Create(_candidateTools.CheckProfileCompletenessAsync, new AIFunctionFactoryOptions { Name = "check_profile_completeness" }),
            AIFunctionFactory.Create(_candidateTools.AnalyzeCvAsync, new AIFunctionFactoryOptions { Name = "analyze_cv" }),
            AIFunctionFactory.Create(_candidateTools.SuggestCvImprovementAsync, new AIFunctionFactoryOptions { Name = "suggest_cv_improvement" }),
            AIFunctionFactory.Create(_candidateTools.SearchJobsAsync, new AIFunctionFactoryOptions { Name = "search_jobs" }),
            AIFunctionFactory.Create(_candidateTools.GetJobDetailsAsync, new AIFunctionFactoryOptions { Name = "get_job_details" }),
            AIFunctionFactory.Create(_candidateTools.GetJobRecommendationsAsync, new AIFunctionFactoryOptions { Name = "get_job_recommendations" }),
            AIFunctionFactory.Create(_candidateTools.ExplainJobMatchAsync, new AIFunctionFactoryOptions { Name = "explain_job_match" }),
            AIFunctionFactory.Create(_candidateTools.CompareJobsAsync, new AIFunctionFactoryOptions { Name = "compare_jobs" }),
            AIFunctionFactory.Create(_candidateTools.GetMyApplicationsAsync, new AIFunctionFactoryOptions { Name = "get_my_applications" }),
            AIFunctionFactory.Create(_candidateTools.GetApplicationStatusAsync, new AIFunctionFactoryOptions { Name = "get_application_status" }),
        ]);
}
