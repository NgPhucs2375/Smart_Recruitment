#nullable enable
using System.Globalization;
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Matching;

public sealed record MatchSkill(int? Id, string? Name, MucDo? Level = null, float? Years = null);
public sealed record MatchRequirement(int? Id, string? Name, MucDoYC Level);
public sealed record CandidateMatchInput(
    IReadOnlyList<MatchSkill> Skills, string? Position = null,
    decimal DesiredSalary = 0, string? Address = null);
public sealed record JobMatchInput(
    IReadOnlyList<MatchRequirement> Requirements, string? Title = null,
    decimal SalaryMin = 0, decimal SalaryMax = 0, string? Location = null,
    string? ExperienceRequired = null);
public sealed record ContentMatchResult(
    float Score, float SkillScore, float PositionBonus, float SalaryBonus, float LocationBonus,
    float ExperienceBonus,
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
    public const string Version = "cbf-v6-utility";

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
        // Dia chi Viet Nam theo quy uoc "quan, tinh/thanh pho": trung ca quan moi dang
        // hon trung mot minh thanh pho, nen bonus chia hai muc thay bang 0.05 cung
        // cho ca hai (ca location-district-vs-city bi tie-break theo ID quyet dinh).
        var locationBonus = !normalized
            ? address.Length > 0 && location.Length > 0 &&
                (location.Contains(address, StringComparison.Ordinal) || address.Contains(location, StringComparison.Ordinal)) ? .05f : 0
            : LocationUtility(address, candidate.Address, location, job.Location);
        // So nam cua ung vien lay tu bang chung ky nang dau tien (MatchSkill.Years) —
        // du lieu da co san trong CV nen khong can them query nao cho luot cham diem.
        var experienceBonus = 0f;
        if (normalized)
        {
            var required = RequiredYears(job.ExperienceRequired);
            var actual = candidate.Skills.Where(x => x.Years.HasValue).Select(x => x.Years).Max();
            if (required is > 0 && actual.HasValue)
                experienceBonus = ExperienceUtilityFactor *
                    (2f * Math.Min(1f, actual.Value / required.Value) - 1f);
        }

        return new ContentMatchResult(
            Math.Min(1, skillScore + positionBonus + salaryBonus + locationBonus + experienceBonus),
            skillScore, positionBonus, salaryBonus, locationBonus, experienceBonus,
            matched, missing, missingMandatory);
    }

    /// <summary>
    /// Do lech giua so nam ung vien co va so nam tin doi: du ou tren duoc cong
    /// ExperienceUtilityFactor, thieu het thi bi tru bang do, du mot nua thi trung tinh.
    /// Thuoc tinh bi chan trong [-0.05, +0.05] nen khong dao duoc thu tu cua phan ky nang.
    /// </summary>
    private const float ExperienceUtilityFactor = .05f;

    private static float LocationUtility(string candidateKey, string? candidateAddress,
        string jobKey, string? jobAddress)
    {
        if (candidateKey.Length == 0 || jobKey.Length == 0) return 0f;
        var (candidateCity, candidateDistrict) = LocationParts(candidateAddress);
        var (jobCity, jobDistrict) = LocationParts(jobAddress);
        if (!SamePlace(candidateCity, jobCity)) return 0f;
        return candidateDistrict.Length > 0 && jobDistrict.Length > 0 &&
            SamePlace(candidateDistrict, jobDistrict) ? .05f : .025f;
    }

    /// <summary>
    /// Tach "thanh pho/tinh" (doan cuoi) va "quan/huyen" (doan lien truoc) cua dia chi Viet Nam.
    /// Doan duoc khoa qua MatchingTextNormalizer nen "TP. HCM" va "TP HCM" van quy ve mot.
    /// </summary>
    private static (string City, string District) LocationParts(string? address)
    {
        var parts = (address ?? string.Empty)
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries)
            .Select(MatchingTextNormalizer.LocationKey)
            .Where(x => x.Length > 0)
            .ToList();
        return parts.Count == 0 ? (string.Empty, string.Empty)
            : (parts[^1], parts.Count > 1 ? parts[^2] : string.Empty);
    }

    private static bool SamePlace(string left, string right) =>
        left.Length > 0 && right.Length > 0 &&
        (left.Contains(right, StringComparison.Ordinal) || right.Contains(left, StringComparison.Ordinal));

    /// <summary>
    /// Doc "KinhNghiemYeuCau" (text tu do): so dau tien la can duoi cua dai yeu cau,
    /// nen "1-3 nam" doi 1 nam va "Toi thieu 3 nam ... .NET" doi 3 nam.
    /// "Khong yeu cau" hoac khong co so -> null: thieu du lieu khong bi tinh la 0 nam.
    /// </summary>
    private static float? RequiredYears(string? text)
    {
        var key = MatchingTextNormalizer.TextKey(text);
        if (key.Length == 0) return null;
        if (key.Contains("không yêu cầu", StringComparison.Ordinal) ||
            key.Contains("chưa có kinh nghiệm", StringComparison.Ordinal) ||
            key.Contains("sinh viên mới ra trường", StringComparison.Ordinal))
            return 0;
        var digits = 0;
        var start = -1;
        for (var i = 0; i <= key.Length; i++)
        {
            if (i < key.Length && char.IsAsciiDigit(key[i]))
            {
                if (start < 0) start = i;
                digits++;
                continue;
            }
            if (start < 0) continue;
            return float.Parse(key.AsSpan(start, digits), CultureInfo.InvariantCulture);
        }
        return null;
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
