#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Shared.Services;

/// <summary>
/// Semantic rerank của gợi ý 2 chiều: DeepSeek chỉ sắp lại trong cửa sổ top-N mà
/// ContentBasedMatcher đã chấm điểm, và viết lý do hiển thị. Mọi lỗi đều trả null
/// để luồng gợi ý chạy tiếp bằng thứ tự deterministic.
/// </summary>
public sealed class DeepSeekRecommendationReranker(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<DeepSeekRecommendationReranker> logger) : IRecommendationReranker
{
    // Lớp trang trí: thà mất lý do AI còn hơn kéo dài thêm request gợi ý.
    private static readonly TimeSpan AttemptTimeout = TimeSpan.FromSeconds(20);

    public async Task<RerankResult?> RerankAsync(
        string context,
        IReadOnlyList<RerankItem> items,
        CancellationToken cancellationToken = default)
    {
        if (items.Count == 0)
            return null;
        if (!configuration.GetValue("DeepSeek:RerankEnabled", false))
            return null;

        var apiKey = configuration["DeepSeek:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            apiKey = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogWarning("DeepSeek rerank bỏ qua: chưa có DeepSeek:ApiKey, giữ thứ tự content-based.");
            return null;
        }

        var maxItems = Math.Clamp(configuration.GetValue("DeepSeek:RerankMaxItems", 10), 1, 20);
        var window = items.Take(maxItems).ToList();
        var model = configuration["DeepSeek:Model"];
        if (string.IsNullOrWhiteSpace(model)) model = "deepseek-flash";

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = JsonContent.Create(new
        {
            model = model.Trim(),
            messages = new object[]
            {
                new { role = "user", content = BuildPrompt(context, window) }
            },
            temperature = 0.2,
            // deepseek-flash là model có reasoning: max_tokens tính cho cả
            // reasoning_content lẫn content, nên 10 lý do tiếng Việt cần dư hẳn.
            max_tokens = 4000,
            // Bỏ hẳn phần "ngẫm nghĩ" ở bước này: rerank chỉ là lớp trang trí cho
            // trang gợi ý, đo thực tế 7.5s khi bật reasoning và 2.8s khi tắt.
            thinking = new { type = "disabled" },
            response_format = new { type = "json_object" }
        });

        try
        {
            using var attemptCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            attemptCts.CancelAfter(AttemptTimeout);
            using var response = await httpClient.SendAsync(request, attemptCts.Token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "DeepSeek rerank thất bại, giữ thứ tự content-based. Status={Status}.",
                    (int)response.StatusCode);
                return null;
            }

            using var stream = await response.Content.ReadAsStreamAsync(attemptCts.Token);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: attemptCts.Token);
            return ParseResult(document, window);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "DeepSeek rerank có lỗi, giữ thứ tự content-based.");
            return null;
        }
    }

    private RerankResult? ParseResult(JsonDocument document, IReadOnlyList<RerankItem> window)
    {
        var root = document.RootElement;
        if (!root.TryGetProperty("choices", out var choices)
            || choices.ValueKind != JsonValueKind.Array
            || choices.GetArrayLength() == 0
            || !choices[0].TryGetProperty("message", out var message)
            || !message.TryGetProperty("content", out var content)
            || content.ValueKind != JsonValueKind.String)
        {
            logger.LogWarning("DeepSeek rerank trả về shape lạ, bỏ qua.");
            return null;
        }

        if (choices[0].TryGetProperty("finish_reason", out var finish)
            && finish.GetString() == "length")
        {
            logger.LogWarning("DeepSeek rerank bị cắt vì hết token, bỏ qua.");
            return null;
        }

        var ordered = new List<int>();
        var reasons = new Dictionary<int, string>();
        try
        {
            using var payload = JsonDocument.Parse(content.GetString() ?? string.Empty);
            if (!payload.RootElement.TryGetProperty("results", out var results)
                || results.ValueKind != JsonValueKind.Array)
            {
                logger.LogWarning("DeepSeek rerank thiếu mảng results, bỏ qua.");
                return null;
            }

            var allowed = window.Select(x => x.Id).ToHashSet();
            foreach (var element in results.EnumerateArray())
            {
                if (!TryReadId(element, out var id) || !allowed.Contains(id) || reasons.ContainsKey(id))
                    continue;
                ordered.Add(id);
                reasons[id] = ReadReason(element);
            }
        }
        catch (JsonException)
        {
            logger.LogWarning("DeepSeek rerank trả về JSON không hợp lệ, bỏ qua.");
            return null;
        }

        if (ordered.Count == 0)
            return null;

        // Mục mô hình bỏ sót vẫn nằm cuối cửa sổ, không bao giờ mất khỏi danh sách.
        ordered.AddRange(window.Where(x => !reasons.ContainsKey(x.Id)).Select(x => x.Id));
        return new RerankResult(ordered, reasons);
    }

    private static bool TryReadId(JsonElement element, out int id)
    {
        id = 0;
        if (!element.TryGetProperty("id", out var idElement))
            return false;
        if (idElement.ValueKind == JsonValueKind.Number && idElement.TryGetInt32(out id))
            return true;
        if (idElement.ValueKind == JsonValueKind.String
            && int.TryParse(idElement.GetString(), out id))
            return true;
        return false;
    }

    private static string ReadReason(JsonElement element)
    {
        var reason = element.TryGetProperty("lyDo", out var lyDo) && lyDo.ValueKind == JsonValueKind.String
            ? lyDo.GetString()
            : null;
        reason = (reason ?? string.Empty).Trim();
        return reason.Length > 300 ? reason[..300] : reason;
    }

    private static string BuildPrompt(string context, IReadOnlyList<RerankItem> window)
    {
        var items = window.Select(x => new
        {
            id = x.Id,
            mo_ta = x.Title,
            ky_nang_trung = x.MatchedSkills,
            ky_nang_con_thieu = x.MissingSkills,
            diem_luat = Math.Round(x.RuleScore, 3)
        });

        return $$"""
            Bạn sắp xếp lại kết quả gợi ý khớp giữa CV và tin tuyển dụng.
            Bối cảnh phía người dùng: {{context}}

            Danh sách ứng viên hoặc tin đang được chấm điểm theo luật (chỉ số liệu này, KHÔNG bịa thêm kinh nghiệm hay kỹ năng):
            {{JsonSerializer.Serialize(items)}}

            Nhiệm vụ:
            - Sắp lại theo mức phù hợp thực tế với bối cảnh. Kỹ năng cốt lõi và độ bám vị trí quan trọng hơn số lượng kỹ năng trùng.
            - Viết một lý do tiếng Việt tối đa 140 ký tự cho từng mục, chỉ dựa trên dữ liệu đã cho, không nêu tên riêng của người hay doanh nghiệp.
            - Mọi id trong danh sách phải xuất hiện đúng một lần.

            Chỉ trả về một JSON object theo dạng:
            {"results":[{"id":1,"lyDo":"..."}]}
            """;
    }
}
