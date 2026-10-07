#nullable enable
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Matching;

public sealed record MatchSkill(int? Id, string? Name);
public sealed record MatchRequirement(int? Id, string? Name, MucDoYC Level);
public sealed record CandidateMatchInput(
    IReadOnlyList<MatchSkill> Skills, string? Position = null,
    decimal DesiredSalary = 0, string? Address = null);
public sealed record JobMatchInput(
    IReadOnlyList<MatchRequirement> Requirements, string? Title = null,
    decimal SalaryMin = 0, decimal SalaryMax = 0, string? Location = null);
public sealed record ContentMatchResult(
    float Score, float SkillScore, float PositionBonus, float SalaryBonus, float LocationBonus,
    IReadOnlyList<string> MatchedSkills, IReadOnlyList<string> MissingSkills);

/// <summary>Deterministic scorer shared by both recommendation directions and offline evaluation.</summary>
public static class ContentBasedMatcher
{
    public const string BaselineVersion = "cbf-v1";
    public const string Version = "cbf-v2-normalized";

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

        var ids = candidate.Skills.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();
        var names = candidate.Skills.Select(x => SkillKey(x.Name)).Where(x => x.Length > 0)
            .ToHashSet(StringComparer.Ordinal);
        var requirements = job.Requirements.Where(x => !string.IsNullOrWhiteSpace(x.Name)).ToList();
        if (normalized)
        {
            // Alias duplicates must not inflate the denominator; keep the strongest requirement.
            requirements = requirements.GroupBy(x => SkillKey(x.Name), StringComparer.Ordinal)
                .Select(g => g.OrderByDescending(x => Weight(x.Level)).First()).ToList();
        }

        var matched = new List<string>();
        var missing = new List<string>();
        float totalWeight = 0, matchedWeight = 0;
        foreach (var requirement in requirements)
        {
            var weight = Weight(requirement.Level);
            totalWeight += weight;
            if (requirement.Id.HasValue && ids.Contains(requirement.Id.Value) || names.Contains(SkillKey(requirement.Name)))
            {
                matchedWeight += weight;
                matched.Add(requirement.Name!.Trim());
            }
            else missing.Add(requirement.Name!.Trim());
        }

        var skillScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;
        var position = TextKey(candidate.Position);
        var title = TextKey(job.Title);
        var positionBonus = position.Length >= 3 && (!normalized || title.Length > 0) &&
            (title.Contains(position, StringComparison.Ordinal) || position.Contains(title, StringComparison.Ordinal)) ? .10f : 0;
        var salaryBonus = candidate.DesiredSalary > 0 && job.SalaryMax >= candidate.DesiredSalary &&
            (job.SalaryMin <= candidate.DesiredSalary || job.SalaryMin == 0) ? .05f : 0;
        var address = TextKey(candidate.Address);
        var location = TextKey(job.Location);
        var locationBonus = address.Length > 0 && location.Length > 0 &&
            (location.Contains(address, StringComparison.Ordinal) || address.Contains(location, StringComparison.Ordinal)) ? .05f : 0;

        return new ContentMatchResult(Math.Min(1, skillScore + positionBonus + salaryBonus + locationBonus),
            skillScore, positionBonus, salaryBonus, locationBonus, matched, missing);
    }

    private static float Weight(MucDoYC level) => level switch
    {
        MucDoYC.BatBuc => 3, MucDoYC.UuTien => 2, _ => 1
    };
}
