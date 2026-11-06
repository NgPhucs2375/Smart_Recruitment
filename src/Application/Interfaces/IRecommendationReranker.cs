#nullable enable
namespace Application.Interfaces;

/// <summary>Một kết quả đã có điểm deterministic, gửi cho mô hình để sắp lại.</summary>
public sealed record RerankItem(
    int Id,
    string Title,
    IReadOnlyList<string> MatchedSkills,
    IReadOnlyList<string> MissingSkills,
    float RuleScore);

/// <summary>Thứ tự ưu tiên mới và lý do ngắn gọn cho từng mục được mô hình sắp xếp.</summary>
public sealed record RerankResult(
    IReadOnlyList<int> OrderedIds,
    IReadOnlyDictionary<int, string> Reasons);

/// <summary>
/// Lớp semantic rerank cho gợi ý 2 chiều. Điểm khớp vẫn do ContentBasedMatcher
/// sinh ra; mô hình chỉ tái sắp xếp trong cửa sổ top-N và viết lý do hiển thị.
/// </summary>
public interface IRecommendationReranker
{
    /// <summary>
    /// Trả null khi tính năng tắt, thiếu API key, quá thời gian hoặc mô hình trả
    /// kết quả không hợp lệ — caller giữ nguyên thứ tự deterministic.
    /// </summary>
    Task<RerankResult?> RerankAsync(
        string context,
        IReadOnlyList<RerankItem> items,
        CancellationToken cancellationToken = default);
}
