#nullable enable
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Matching;

public sealed record MatchSkill(int? Id, string? Name, MucDo? Level = null, float? Years = null);
public sealed record MatchRequirement(int? Id, string? Name, MucDoYC Level);
public sealed record CandidateMatchInput(
    IReadOnlyList<MatchSkill> Skills, string? Position = null,
    decimal DesiredSalary = 0, string? Address = null);
public sealed record JobMatchInput(
    IReadOnlyList<MatchRequirement> Requirements, string? Title = null,
    decimal SalaryMin = 0, decimal SalaryMax = 0, string? Location = null);
public sealed record ContentMatchResult(
    float Score, float SkillScore, float PositionBonus, float SalaryBonus, float LocationBonus,
    IReadOnlyList<string> MatchedSkills, IReadOnlyList<string> MissingSkills,
    IReadOnlyList<string>? MissingMandatory = null)
{
    /// <summary>
    /// Kỹ năng bắt buộc chưa có bằng chứng. Điểm <c>Score</c> không đổi vì cổng này: màn hình
    /// Gợi ý việc làm chấm trên chính nó, nên siết điểm sẽ đổi luôn thứ tự đang chạy thật.
    /// Nó là nhãn screening — người dùng tự quyết định có ứng tuyển khi thiếu một kỹ năng hay không.
    /// </summary>
    public IReadOnlyList<string> MissingMandatory { get; init; } = MissingMandatory ?? [];

    /// <summary>Cổng giao thoa (conjunctive screening): mọi yêu cầu BatBuc phải có bằng chứng, không bù trừ.</summary>
    public bool MeetsMandatory => MissingMandatory.Count == 0;
}

/// <summary>Deterministic scorer shared by both recommendation directions and offline evaluation.</summary>
public static class ContentBasedMatcher
{
    public const string BaselineVersion = "cbf-v1";
    public const string Version = "cbf-v5-gated";

    /// <summary>
    /// π = mức phủ kỹ năng kỳ vọng trước khi có bằng chứng, p = trọng số ảo theo thang Weight().
    /// Cặp (0.4, 5) chỉnh theo dữ liệu đang chạy: 90 tin hiệu lực có tổng trọng số yêu cầu từ 9 đến 22,
    /// 76 tin trong số đó đúng W=12. Ở W=12, khớp toàn bộ còn 0.82 (vẫn loại Cao), khớp 10/12 trở lên
    /// mới đạt Cao, khớp 3/12 vẫn 0.29 (loại Thap) — ngưỡng PhanLoai cũ giữ nguyên ý nghĩa,
    /// chỉ bỏ được trần 1.0 mà một tin ghi ít yêu cầu vẫn đòi được.
    /// </summary>
    private const float PriorCoverage = 0.4f;
    private const float PriorWeight = 5f;

    public static ContentMatchResult Evaluate(CandidateMatchInput candidate, JobMatchInput job) =>
        EvaluateCore(candidate, job, normalized: true);

    /// <summary>Original trim/lower + overlap formula, retained as a reproducible baseline.</summary>
    public static ContentMatchResult EvaluateBaseline(CandidateMatchInput candidate, JobMatchInput job) =>
        EvaluateCore(candidate, job, normalized: false);

    private static ContentMatchResult EvaluateCore(CandidateMatchInput candidate, JobMatchInput job, bool normalized)
    {
        string TextKey(string? value) => normalized ? MatchingTextNormalizer.TextKey(value)
            : (value ?? string.Empty).Trim().ToLowerInvariant();
        string SkillKey(string? value) => normalized ? MatchingTextNormalizer.SkillKey(value) : TextKey(value);
        string LocationKey(string? value) => normalized ? MatchingTextNormalizer.LocationKey(value) : TextKey(value);
        float Membership(MatchSkill skill) => !normalized ? 1f : ProficiencyFactor(skill);

        var requirements = job.Requirements.Where(x => !string.IsNullOrWhiteSpace(x.Name)).ToList();
        if (normalized)
        {
            // Alias duplicates must not inflate the denominator; keep the strongest requirement.
            requirements = requirements.GroupBy(x => SkillKey(x.Name), StringComparer.Ordinal)
                .Select(g => g.OrderByDescending(x => Weight(x.Level)).First()).ToList();
        }

        var matched = new List<string>();
        var missing = new List<string>();
        var missingMandatory = new List<string>();
        float totalWeight = 0, matchedWeight = 0;
        foreach (var requirement in requirements)
        {
            var weight = Weight(requirement.Level);
            totalWeight += weight;
            var key = SkillKey(requirement.Name);
            var evidence = candidate.Skills
                .Where(x => requirement.Id.HasValue && x.Id == requirement.Id.Value ||
                            key.Length > 0 && SkillKey(x.Name) == key)
                .OrderByDescending(Membership)
                .FirstOrDefault();
            if (evidence != null)
            {
                matchedWeight += weight * Membership(evidence);
                matched.Add(requirement.Name!.Trim());
            }
            else
            {
                missing.Add(requirement.Name!.Trim());
                if (requirement.Level == MucDoYC.BatBuc)
                    missingMandatory.Add(requirement.Name!.Trim());
            }
        }

        // Bao phu yeu cau duoc calibration truoc khi cong them uu dai. Ty so thuan
        // (matched/total) cho tin chi ghi 1 yeu cau bang 1.0 — bang tin ghi 5 yeu cau
        // va khop ca 2 bat buoc — nen diem khong so sanh duoc giua cac tin.
        // Cong thuc Bayesian dua ty so ve π theo luong bang chung: it yeu cau thi
        // diem bi ke ve π, nhieu yeu cau thi gan voi ty so thuc te hon.
        // Khong match yeu cau nao thi van 0: bo loc "diem > 0" cua API va fan-out
        // dung gia tri nay de loai tin ran, nen gi nguyen hanh vi cu.
        var rawCoverage = totalWeight > 0 ? matchedWeight / totalWeight : 0f;
        var skillScore = !normalized ? rawCoverage
            : totalWeight > 0 && matchedWeight > 0
                ? (matchedWeight + PriorWeight * PriorCoverage) / (totalWeight + PriorWeight)
                : 0f;
        var position = TextKey(candidate.Position);
        var title = TextKey(job.Title);
        var positionBonus = position.Length >= 3 && (!normalized || title.Length > 0) &&
            (title.Contains(position, StringComparison.Ordinal) || position.Contains(title, StringComparison.Ordinal)) ? .10f : 0;
        var salaryBonus = candidate.DesiredSalary > 0 && job.SalaryMax >= candidate.DesiredSalary &&
            (job.SalaryMin <= candidate.DesiredSalary || job.SalaryMin == 0) ? .05f : 0;
        var address = LocationKey(candidate.Address);
        var location = LocationKey(job.Location);
        var locationBonus = address.Length > 0 && location.Length > 0 &&
            (location.Contains(address, StringComparison.Ordinal) || address.Contains(location, StringComparison.Ordinal)) ? .05f : 0;

        return new ContentMatchResult(Math.Min(1, skillScore + positionBonus + salaryBonus + locationBonus),
            skillScore, positionBonus, salaryBonus, locationBonus, matched, missing, missingMandatory);
    }

    private static float Weight(MucDoYC level) => level switch
    {
        MucDoYC.BatBuc => 3, MucDoYC.UuTien => 2, _ => 1
    };

    /// <summary>
    /// Hạng tử thuộc tính mờ của trình độ ứng viên với một kỹ năng: tự nhận Cơ bản chỉ được tính
    /// 40% trọng số yêu cầu, Trung bình 70%, Thành thạo và Chuyên gia đủ 100% (chuyên gia không
    /// được cộng vượt mức yêu cầu). Tin chỉ ghi yêu cầu, không ghi trình độ cần bao nhiêu.
    /// Thiếu trình độ thì suy ra từ số năm; thiếu cả hai thì trung tính 100% để không phạt
    /// hồ sơ chưa điền, vì dữ liệu trống không phải bằng chứng ứng viên yếu.
    /// </summary>
    private static float ProficiencyFactor(MatchSkill skill) => skill.Level switch
    {
        MucDo.CoBan => .4f,
        MucDo.TrungBinh => .7f,
        _ when skill.Years >= 3 => 1f,
        _ when skill.Years >= 1 => .7f,
        _ when skill.Years > 0 => .4f,
        _ => 1f
    };

    /// <summary>Ngưỡng phân loại dùng chung cho mọi nơi hiển thị điểm match.</summary>
    public static PhanLoaiKetQua PhanLoaiCua(float diem) =>
        diem >= 0.66f ? PhanLoaiKetQua.Cao
        : diem >= 0.33f ? PhanLoaiKetQua.TrungBinh
        : PhanLoaiKetQua.Thap;
}
