using System.ClientModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI;
using OpenAI.Chat;

namespace WebApp.Server.Extensions;

public static class AIAgentExtension
{
    public static AIAgent AgentSmart(this IServiceCollection servicees)
    {
        string groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") 
                            ?? throw new InvalidOperationException("Chưa khai báo GROQ_API_KEY trong file .env!");

        var groqOptions = new OpenAIClientOptions
        {
            Endpoint = new Uri("https://api.groq.com/openai/v1")
        };

        var rawChatClient = new ChatClient(
            model: "qwen/qwen3.6-27b",
            credential: new ApiKeyCredential(groqApiKey), 
            options: groqOptions
        );
        IChatClient chatClient = rawChatClient.AsIChatClient();

        return chatClient.AsAIAgent(
            name: "smart-agent",
            instructions: "Bạn là một Chuyên gia về CV và hướng nghiệp chuyên nghiệp chạy trên nền tảng Groq siêu tốc. " +
                          "Hãy đọc thông tin CV của người dùng qua Readables ở màn hình bên cạnh, " +
                          "sau đó tư vấn và chủ động gọi Frontend Tool 'updateCVFields' để điền/tối ưu hóa CV hộ họ."
        );
    }
}