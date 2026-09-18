using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using WebApp.Server.Agent.CvAssistant.Tools;

namespace WebApp.Server.Agent.CvAssistant;

// Scoped factory: agent và tools dùng cùng request scope với MediatR/DbContext/user hiện tại.
// Triết lý form-là-source-of-truth: BE chỉ expose tool ĐỌC (get_my_profile, get_cv_detail).
// Đường ghi duy nhất là nút "Lưu CV" ở /tao-cv (cvApi.saveVersion, kèm render PDF client).
// CvCommandTools/CreateCVByAgentCommand giữ lại cho tương thích nhưng KHÔNG expose cho LLM
// để tránh tạo CV rỗng trong DB khi user chỉ nói "tạo CV với tên X" (xem SystemPrompt intent).
internal sealed class CvAssistantAgentFactory
{
    //sealed : la type kieu chan ke thua va chan override
    private readonly CvQueryTools _queryTools;
    private readonly IChatClient _chatClient;

    public CvAssistantAgentFactory(
        CvQueryTools queryTools,
        [FromKeyedServices(CvAssistantInstructions.ChatClientKey)] IChatClient chatClient)
    {
        _queryTools = queryTools;
        _chatClient = chatClient;
    }

    public AIAgent CreateAgent()
    {
         return new ChatClientAgent(
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
                    _queryTools.GetMyCvsAsync,
                    new AIFunctionFactoryOptions { Name = "list_my_cvs" })
            ]);
    }
}
