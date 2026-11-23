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

    public AIAgent CreateAgent()
    {
        var tools = new List<AITool>
        {
            AIFunctionFactory.Create(_tools.GetCandidateRecommendationsForJobAsync, new AIFunctionFactoryOptions { Name = "get_candidate_recommendations_for_job" }),
            AIFunctionFactory.Create(_tools.GetMyRecruitmentJobsAsync, new AIFunctionFactoryOptions { Name = "get_my_recruitment_jobs" }),
            AIFunctionFactory.Create(_tools.GetCurrentRecruitmentContextAsync, new AIFunctionFactoryOptions { Name = "get_current_recruitment_context" }),
            AIFunctionFactory.Create(_tools.GetRecruitmentJobDetailAsync, new AIFunctionFactoryOptions { Name = "get_recruitment_job_detail" }),
            AIFunctionFactory.Create(_tools.AnalyzeJobPostAsync, new AIFunctionFactoryOptions { Name = "analyze_job_post" }),
            AIFunctionFactory.Create(_tools.ExplainCandidateMatchAsync, new AIFunctionFactoryOptions { Name = "explain_candidate_match" }),
            AIFunctionFactory.Create(_tools.CompareCandidatesAsync, new AIFunctionFactoryOptions { Name = "compare_candidates" }),
            AIFunctionFactory.Create(_tools.GetCandidateCVAsync, new AIFunctionFactoryOptions { Name = "get_candidate_cv" }),
            AIFunctionFactory.Create(_tools.SummarizeCandidateAsync, new AIFunctionFactoryOptions { Name = "summarize_candidate" }),
            AIFunctionFactory.Create(_tools.GetApplicationsAsync, new AIFunctionFactoryOptions { Name = "get_applications" }),
            AIFunctionFactory.Create(_tools.GetApplicationDetailAsync, new AIFunctionFactoryOptions { Name = "get_application_detail" }),
            AIFunctionFactory.Create(_tools.GetApplicationPipelineAsync, new AIFunctionFactoryOptions { Name = "get_application_pipeline" }),
            AIFunctionFactory.Create(_tools.FindStaleApplicationsAsync, new AIFunctionFactoryOptions { Name = "find_stale_applications" }),
            AIFunctionFactory.Create(_tools.GetRecruitmentOverviewAsync, new AIFunctionFactoryOptions { Name = "get_recruitment_overview" }),
            AIFunctionFactory.Create(_tools.GetCompanyRecruitmentStatsAsync, new AIFunctionFactoryOptions { Name = "get_company_recruitment_stats" }),
            AIFunctionFactory.Create(_tools.GetCompanyMembersAsync, new AIFunctionFactoryOptions { Name = "get_company_members" }),
            AIFunctionFactory.Create(_tools.GetRecruiterActivityAsync, new AIFunctionFactoryOptions { Name = "get_recruiter_activity" }),
            AIFunctionFactory.Create(_tools.GetMyNotificationsAsync, new AIFunctionFactoryOptions { Name = "get_my_notifications" }),
        };

        return new ChatClientAgent(
            _chatClient,
            new ChatClientAgentOptions
            {
                Name = RecruiterAdamInstructions.AgentName,
                Description = "Trợ lý tuyển dụng cho nhân sự và người đại diện doanh nghiệp.",
                ChatOptions = new ChatOptions
                {
                    Instructions = RecruiterAdamInstructions.SystemPrompt,
                    Temperature = 0.1f,
                    MaxOutputTokens = 4096,
                    // Cho phép chuỗi 2 bước (context -> chi tiết/ứng viên) trong cùng lượt;
                    // số tool mỗi lượt vẫn bị giới hạn bằng quy tắc trong RecruiterAdamInstructions.
                    AllowMultipleToolCalls = true,
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
    }
}
