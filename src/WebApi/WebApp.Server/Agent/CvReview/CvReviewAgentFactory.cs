using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using WebApp.Server.Agent.Adam.Tools;
using WebApp.Server.Agent.RecommenAdam.Candidate;

namespace WebApp.Server.Agent.CvReview;

/// <summary>
/// Agent đánh giá CV có tool-loop thật: model tự gọi 3 tool read-only
/// (CV, JD, điểm khớp) rồi trả JSON nhận xét. Không ghi DB, không tự sửa CV.
/// </summary>
internal sealed class CvReviewAgentFactory(
    CvQueryTools cvQueryTools,
    CandidateTools candidateTools,
    IServiceProvider services)
{
    public AIAgent CreateAgent()
    {
        // Resolve keyed client ở đây (không inject vào ctor) để key thiếu/hỏng
        // rơi vào nhánh fallback của runner thay vì làm DI activation nổ 500.
        var chatClient = services.GetRequiredKeyedService<IChatClient>(
            CandidateAdamInstructions.ChatClientKey);

        var tools = new List<AITool>
        {
            AIFunctionFactory.Create(cvQueryTools.GetCvDetailAsync,
                new AIFunctionFactoryOptions { Name = "get_cv_detail" }),
            AIFunctionFactory.Create(candidateTools.GetJobDetailsAsync,
                new AIFunctionFactoryOptions { Name = "get_job_details" }),
            AIFunctionFactory.Create(candidateTools.GetMatchBreakdownAsync,
                new AIFunctionFactoryOptions { Name = "get_cv_job_match" }),
        };

        return new ChatClientAgent(
            chatClient,
            new ChatClientAgentOptions
            {
                Name = "CvReviewer",
                Description = "Đánh giá một CV theo một tin tuyển dụng.",
                ChatOptions = new ChatOptions
                {
                    Instructions = CvReviewInstructions.SystemPrompt,
                    Temperature = 0.1f,
                    MaxOutputTokens = 1400,
                    AllowMultipleToolCalls = true,
                    ResponseFormat = ChatResponseFormat.Json,
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
