using System.ClientModel;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI;
using OpenAI.Chat;

namespace WebApp.Server.Extensions;

public static class AIAgentExtension
{
    public static AIAgent CreateSmartAgent(JsonSerializerOptions jsonOptions)
    {
        string groqApiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") 
                            ?? throw new InvalidOperationException("Chưa khai báo GROQ_API_KEY trong file .env!"); //[cite: 29]
        var groqOptions = new OpenAIClientOptions
        {
            Endpoint = new Uri("https://omniroute.operamind.one/v1") //[cite: 29]
        };

        var openAiClient = new OpenAIClient(new ApiKeyCredential(groqApiKey), groqOptions);
        var chatClient = openAiClient.GetChatClient("gpt").AsIChatClient(); //[cite: 31]

        var chatClientAgent = new ChatClientAgent(
            chatClient,
            name: "smart-agent",
            instructions: """
                Bạn là Chuyên gia Tư vấn Hướng nghiệp và Xây dựng CV Chuyên nghiệp.
                Nhiệm vụ của bạn là phỏng vấn người dùng từng bước qua hội thoại để trích xuất thông tin và cập nhật vào State chung của hệ thống (CVStateSnapshot gồm: fullName, summary, experience, skills).
                Quy tắc nghiệp vụ:
                1. Dữ liệu và Trích xuất:
                   - Đối chiếu State hiện tại và thông tin mới nhận từ người dùng.
                   - Chỉ cập nhật/bổ sung các trường có thông tin mới; giữ nguyên dữ liệu hợp lệ đã có từ trước.
                   - Tự động chuẩn hóa câu chữ theo chuẩn doanh nghiệp (sử dụng động từ hành động mạnh mẽ, cấu trúc rõ ràng, định lượng kết quả).
                2. Chiến lược hội thoại (Interactive Strategy):
                   - Nếu CV còn trống: Bắt đầu hỏi thăm họ tên, vị trí ứng tuyển mục tiêu.
                   - Tiếp tục khai thác: Tóm tắt bản thân (Summary) -> Kinh nghiệm làm việc (Experience) -> Kỹ năng (Skills).
                   - Áp dụng kỹ thuật phỏng vấn đào sâu: Khi người dùng chia sẻ kinh nghiệm, hãy gợi ý bổ sung số liệu (metrics, KPIs) hoặc công nghệ/phương pháp áp dụng.
                   - Không hỏi dồn dập toàn bộ thông tin cùng lúc; mỗi lượt chat chỉ tập trung làm rõ 1 đến 2 nội dung chính.
                3. Luôn phản hồi bằng tiếng Việt với phong thái chuyên nghiệp, chuẩn mực.
                """ //[cite: 31]
        );

        // Bọc luồng hội thoại bằng SharedStateAgent để bắt schema JSON tự động
        return new SharedStateAgent(chatClientAgent, jsonOptions); //[cite: 30, 31]
    }
}