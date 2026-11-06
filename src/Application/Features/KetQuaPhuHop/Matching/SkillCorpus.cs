#nullable enable
using System.Collections.Immutable;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Matching;

/// <summary>
/// Tần suất xuất hiện của từng kỹ năng trong các tin đang tuyển, sửa một lỗi cố hữu của tỉ lệ phủ
/// kỹ năng: khớp "Excel" (có mặt ở 32/90 tin) và khớp "Kubernetes" (hiếm) đang cùng được cộng
/// đúng 3 điểm trọng số BatBuc.
///
/// Trọng số = idf chia cho trung bình của corpus rồi chặn trong [0.5, 2.0]. Trung bình lấy theo
/// TẦN SỐ (Σ df·idf / Σ df), không lấy theo số kỹ năng khác nhau: đo trên 90 tin đang chạy thì
/// chia trung bình thô cho hệ số trung bình 0,836 trên mỗi đơn vị trọng số yêu cầu, tức là mọi
/// điểm đều bị hạ và 70 cặp loại Cao rơi còn 45 mà không cặp nào đi lên — IDF khi đó chỉ là một
/// cú trừ điểm đồng loạt. Chia theo tần số thì hệ số đó là 1,008: tin điển hình vẫn có W quanh 12,
/// ngưỡng π/p và nhãn PhanLoai của bước #3 giữ nguyên nghĩa, chỉ thứ tự tương đối thay đổi.
/// </summary>
public sealed class SkillCorpus
{
    public const float MinWeight = .5f;
    public const float MaxWeight = 2f;

    private readonly ImmutableDictionary<string, float> _weights;

    private SkillCorpus(int postings, ImmutableDictionary<string, float> weights)
    {
        Postings = postings;
        _weights = weights;
    }

    /// <summary>Số tin hiệu lực đã dùng để dựng bảng; 0 nghĩa là chưa có corpus.</summary>
    public int Postings { get; }

    public static SkillCorpus Empty { get; } = new(0, ImmutableDictionary<string, float>.Empty);

    /// <summary>
    /// Đầu vào là từng cặp (tin, yêu cầu) thô. Việc gộp theo SkillKey rồi đếm DISTINCT ở dưới
    /// khiến ".NET" và ".NET Core" — hai dòng danh mục thật trùng nhau — chỉ tính một lần
    /// cho mỗi tin, thay vì cộng dồn hai tần số.
    /// </summary>
    public static SkillCorpus Build(int postings, IEnumerable<(int PostingId, string Name)> requirements)
    {
        if (postings <= 0) return Empty;
        return FromDocumentFrequencies(postings, requirements
            .Select(x => (Key: MatchingTextNormalizer.SkillKey(x.Name), x.PostingId))
            .Distinct()
            .GroupBy(x => x.Key, StringComparer.Ordinal)
            .Select(g => (g.Key, Df: g.Count())));
    }

    /// <summary>
    /// Phiên bản tần số có sẵn, dùng cho bộ đánh giá offline: key là tên kỹ năng, value là số tin
    /// chứa nó trên <paramref name="postings"/> tin. Hai dòng alias cùng chỉ một kỹ năng (".NET"
    /// và ".NET Core") lấy max chứ không cộng, vì không có bằng chứng hai tập tin đó rời nhau.
    /// </summary>
    public static SkillCorpus BuildFromFrequencies(int postings, IEnumerable<KeyValuePair<string, int>> frequencies)
    {
        if (postings <= 0) return Empty;
        return FromDocumentFrequencies(postings, frequencies
            .GroupBy(x => MatchingTextNormalizer.SkillKey(x.Key), StringComparer.Ordinal)
            .Select(g => (g.Key, Df: g.Max(x => x.Value))));
    }

    private static SkillCorpus FromDocumentFrequencies(
        int postings, IEnumerable<(string Key, int Df)> documentFrequencies)
    {
        var rows = documentFrequencies
            .Where(x => x.Key.Length > 0)
            .Select(x => (x.Key, x.Df, Idf: MathF.Log((postings + 1f) / (x.Df + 1f))))
            .ToList();
        var totalFrequency = rows.Sum(x => (float)x.Df);
        if (rows.Count == 0 || totalFrequency <= 0f) return Empty;
        var mean = rows.Sum(x => x.Df * x.Idf) / totalFrequency;
        if (mean <= 0f) return Empty;
        return new SkillCorpus(postings, rows.ToImmutableDictionary(x => x.Key,
            x => Math.Clamp(x.Idf / mean, MinWeight, MaxWeight), StringComparer.Ordinal));
    }

    /// <summary>
    /// Hệ số nhân vào trọng số MucDoYC của một yêu cầu. Trả 1 khi chưa có corpus để mọi đường tính
    /// cũ (cbf-v1 baseline và fixture không khai báo corpus) cho kết quả y như trước.
    /// </summary>
    public float WeightOf(string skillKey)
    {
        if (Postings == 0 || skillKey.Length == 0) return 1f;
        return _weights.TryGetValue(skillKey, out var weight) ? weight : MaxWeight;
    }

    /// <summary>Số kỹ năng khác nhau đã có trong bảng; phục vụ diễn giải và kiểm tra.</summary>
    public int KnownSkills => _weights.Count;
}

/// <summary>
/// Một query rẻ trên toàn bộ yêu cầu kỹ năng của các tin đang tuyển (toàn DB hiện tại ~490 dòng).
/// Không cache: chi phí nhỏ hơn cả một lượt chấm điểm, và corpus đúng dữ liệu mới là thứ muốn có
/// ngay sau khi nhà tuyển dụng sửa tin.
/// </summary>
public static class SkillCorpusLoader
{
    public static async Task<SkillCorpus> LoadAsync(
        IApplicationDbContext context, DateTime nowUtc, CancellationToken ct = default)
    {
        var postings = await context.TinTuyenDungs.AsNoTracking()
            .Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (t.NgayHetHan == null || t.NgayHetHan > nowUtc))
            .Select(t => t.Id)
            .ToListAsync(ct);
        if (postings.Count == 0) return SkillCorpus.Empty;

        var requirements = await context.KyNangTinTuyenDungs.AsNoTracking()
            .Where(k => postings.Contains(k.TinTuyenDungId) &&
                        k.DanhMucKyNang != null && k.DanhMucKyNang.TenKyNang != "")
            .Select(k => new { k.TinTuyenDungId, k.DanhMucKyNang!.TenKyNang })
            .ToListAsync(ct);

        return SkillCorpus.Build(postings.Count, requirements
            .Select(x => (x.TinTuyenDungId, x.TenKyNang))
            .Where(x => x.Item2 != null)
            .Select(x => (x.TinTuyenDungId, x.Item2!)));
    }
}
