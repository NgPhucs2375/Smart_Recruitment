using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Features.KetQuaPhuHop.Matching;
using Domain.Enums;
using RecommendationMatching.Checks;

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception($"FAIL: {name}");
    checks++;
    Console.WriteLine($"PASS: {name}");
}
bool Near(double actual, double expected) => Math.Abs(actual - expected) < 0.00001;
CandidateMatchInput Candidate(params string[] skills) => new(skills.Select(x => new MatchSkill(null, x)).ToList());
JobMatchInput Job(params string[] skills) => new(skills.Select(x => new MatchRequirement(null, x, MucDoYC.BatBuc)).ToList());

Check(MatchingTextNormalizer.SkillKey(" ＪＳ\t") == "javascript", "Unicode full-width alias");
Check(MatchingTextNormalizer.TextKey(" Hà\t  Nội\r\n") == "hà nội", "Whitespace normalized, Vietnamese accents preserved");
Check(MatchingTextNormalizer.TextKey("Ha\u0300 Nô\u0323i") == MatchingTextNormalizer.TextKey("Hà Nội"), "Decomposed Unicode compares equally");
Check(MatchingTextNormalizer.SkillKey(null) == "", "Null skill is empty");
Check(MatchingTextNormalizer.SkillKey("C#") != MatchingTextNormalizer.SkillKey("C++"), "C# and C++ stay distinct");
Check(MatchingTextNormalizer.SkillKey("Java") != MatchingTextNormalizer.SkillKey("JavaScript"), "Java and JavaScript stay distinct");
Check(MatchingTextNormalizer.SkillKey("SQL") != MatchingTextNormalizer.SkillKey("SQL Server"), "Generic and vendor skills stay distinct");
Check(MatchingTextNormalizer.SkillKey(".NET") != MatchingTextNormalizer.SkillKey("ASP.NET Core"), "Platform does not imply framework experience");
Check(MatchingTextNormalizer.SkillKey("Research skill") == "research skill", "Unknown skill retained");
Check(MatchingTextNormalizer.SkillKey("ML") == "machine learning", "CV abbreviation ML resolves");
Check(MatchingTextNormalizer.SkillKey("Node") == "node.js", "CV abbreviation Node resolves");
Check(MatchingTextNormalizer.SkillKey("Express") == MatchingTextNormalizer.SkillKey("Express.js"), "Express and Express.js are one skill");
Check(MatchingTextNormalizer.SkillKey(".NET Core") == MatchingTextNormalizer.SkillKey(".NET"), "NET Core is evidence for NET");
Check(MatchingTextNormalizer.SkillKey(".NET Framework") != MatchingTextNormalizer.SkillKey(".NET Core"), "Legacy framework stays distinct from modern core");
Check(MatchingTextNormalizer.SkillKey("CI/CD") == MatchingTextNormalizer.SkillKey("CI CD"), "Slash and space spell the same catalogue row");
Check(MatchingTextNormalizer.SkillKey("React Native") != MatchingTextNormalizer.SkillKey("React"), "React Native is not a substring match for React");

// IDF. Excel 32 / SQL 31 / Kubernetes 5 la df do duoc tren 90 tin hieu luc; hai ky nang mem
// 40/38 la gia dinh cua ca toan: trong DB that "Communication" chi co 13/90 va "Teamwork" 1/90
// dong yeu cau co cau truc, nen tren duong dat IDC chua co tac dung nay (xem README buoc #5).
var idf = SkillCorpus.BuildFromFrequencies(90, new Dictionary<string, int>
{
    ["Excel"] = 32, ["SQL"] = 31, ["Kubernetes"] = 5, ["Giao tiếp tốt"] = 40, ["Làm việc nhóm"] = 38
});
Check(idf.WeightOf(MatchingTextNormalizer.SkillKey("Excel")) <
    idf.WeightOf(MatchingTextNormalizer.SkillKey("Kubernetes")), "A skill in a third of postings weighs less than a rare one");
Check(idf.WeightOf(MatchingTextNormalizer.SkillKey("excel")) ==
    idf.WeightOf(MatchingTextNormalizer.SkillKey("Excel")), "Frequency lookup ignores case like the matcher does");
Check(idf.WeightOf("deep learning") is >= SkillCorpus.MinWeight and <= SkillCorpus.MaxWeight,
    "Corpus weights are clamped so a tin dien hinh van quanh W=12");
Check(SkillCorpus.Empty.WeightOf("excel") == 1f, "No corpus means the pre-IDF formula");
// Chuan hoa phai theo TAN SO, khong theo so ky nang khac nhau. Tren 90 tin dang chay, chia
// trung binh tho cho he so trung binh 0,836 tren moi don vi trong so yeu cau: IDF khi do tro
// thanh mot cú tru diem dan loat (70 cap loai Cao roi con 45, khong cap nao tang len).
var skewed = new Dictionary<string, int>
{
    ["Excel"] = 32, ["SQL"] = 31, ["Docker"] = 19, ["Git"] = 10, ["Kubernetes"] = 5, ["NestJS"] = 1
};
var demandWeighted = SkillCorpus.BuildFromFrequencies(90, skewed);
Check(skewed.Sum(x => demandWeighted.WeightOf(MatchingTextNormalizer.SkillKey(x.Key)) * x.Value) /
    skewed.Values.Sum() is > 0.95f and < 1.05f,
    "Average credit per unit of live requirement weight stays at one");
var rarityCandidate = new CandidateMatchInput([
    new MatchSkill(null, "Kubernetes"), new(null, "Giao tiếp tốt"), new(null, "Làm việc nhóm")]);
var softJd = new JobMatchInput([
    new(null, "Giao tiếp tốt", MucDoYC.BatBuc), new(null, "Làm việc nhóm", MucDoYC.BatBuc)]);
var rareJd = new JobMatchInput([new(null, "Kubernetes", MucDoYC.BatBuc)]);
Check(ContentBasedMatcher.Evaluate(rarityCandidate, softJd).SkillScore >
    ContentBasedMatcher.Evaluate(rarityCandidate, rareJd).SkillScore, "Without IDF two soft skills still beat one hard skill");
Check(ContentBasedMatcher.Evaluate(rarityCandidate, rareJd, idf).SkillScore >
    ContentBasedMatcher.Evaluate(rarityCandidate, softJd, idf).SkillScore, "IDF flips the ranking the core-rarity-idf case complains about");
Check(ContentBasedMatcher.Evaluate(Candidate("JS"), Job("JavaScript"), idf).Score > 0,
    "A skill missing from the frequency table is treated as rare, not as worthless");
Check(Near(ContentBasedMatcher.EvaluateBaseline(Candidate("JS"), Job("JavaScript")).Score, 0), "Baseline preserves original alias miss");
// Full coverage of a one-requirement JD: (3 + 5*0.4) / (3 + 5) rather than 1.0.
Check(Near(ContentBasedMatcher.Evaluate(Candidate("JS"), Job("JavaScript")).Score, 0.625f), "Normalized matcher recognizes exact alias");
Check(Near(ContentBasedMatcher.Evaluate(Candidate("Java"), Job("JavaScript")).Score, 0), "No substring skill matching");

MatchSkill Skill(int? id, string name, MucDo? level = null, float? years = null) => new(id, name, level, years);
CandidateMatchInput Graded(params MatchSkill[] skills) => new(skills.ToList());
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", MucDo.CoBan)), Job("JavaScript")).SkillScore, .4f), "Self-rated beginner keeps 40% of requirement weight");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", MucDo.TrungBinh)), Job("JavaScript")).SkillScore, .5125f), "Self-rated intermediate keeps 70%");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", MucDo.ThanhThao)), Job("JavaScript")).SkillScore,
    ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", MucDo.ChuyenGia)), Job("JavaScript")).SkillScore), "Expert does not overshoot advanced");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", null, 4f)), Job("JavaScript")).SkillScore, .625f), "Years fall back when proficiency missing");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", null, 1.5f)), Job("JavaScript")).SkillScore, .5125f), "One to three years counts as intermediate");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", null, .5f)), Job("JavaScript")).SkillScore, .4f), "Under one year counts as beginner");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS")), Job("JavaScript")).SkillScore, .625f), "Blank proficiency stays neutral");
Check(Near(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", MucDo.CoBan), Skill(null, "JavaScript", MucDo.ThanhThao)), Job("JavaScript")).SkillScore, .625f), "Strongest evidence wins for duplicated skill");
Check(Near(ContentBasedMatcher.EvaluateBaseline(Graded(Skill(null, "JavaScript", MucDo.CoBan)), Job("JavaScript")).SkillScore, 1), "Baseline ignores proficiency");

var weighted = new JobMatchInput([
    new(null, "JavaScript", MucDoYC.BatBuc), new(null, "Docker", MucDoYC.UuTien),
    new(null, "Kubernetes", MucDoYC.KhongBatBuoc)]);
var partial = ContentBasedMatcher.Evaluate(Candidate("JS"), weighted);
Check(Near(partial.SkillScore, .45454545f), "Required/preferred/optional weights are 3/2/1");
Check(Near(ContentBasedMatcher.EvaluateBaseline(Candidate("JavaScript"), weighted).SkillScore, .5f), "Baseline ratio of matched weight unchanged");
Check(partial.MatchedSkills.SequenceEqual(["JavaScript"]) && partial.MissingSkills.SequenceEqual(["Docker", "Kubernetes"]), "Evidence uses original requirement names");
Check(Near(ContentBasedMatcher.Evaluate(Candidate("JS", "JavaScript", "JS"), weighted).Score, partial.Score), "Duplicate CV skills do not inflate score");
var duplicateRequirements = new JobMatchInput([
    new(null, "JS", MucDoYC.KhongBatBuoc), new(null, "JavaScript", MucDoYC.BatBuc),
    new(null, "Docker", MucDoYC.BatBuc)]);
var dedup = ContentBasedMatcher.Evaluate(Candidate("JS"), duplicateRequirements);
Check(Near(dedup.Score, .45454545f) && dedup.MatchedSkills.SequenceEqual(["JavaScript"]), "Duplicate JD aliases retain strongest requirement");
Check(Near(ContentBasedMatcher.Evaluate(new([new(7, "")]), new([new(7, "Docker", MucDoYC.BatBuc)])).Score, 0.625f), "Catalog ID can match without CV skill text");
Check(Near(ContentBasedMatcher.Evaluate(Candidate(""), Job(" ")).Score, 0), "Blank requirements do not score");

var bonuses = ContentBasedMatcher.Evaluate(new([], "Backend", 20, "Hà Nội"),
    new([], "Backend Developer", 15, 25, "Hà Nội"));
Check(Near(bonuses.Score, .175) && Near(bonuses.SkillScore, 0), "Bonuses exposed separately from skill score");
Check(Near(ContentBasedMatcher.Evaluate(new([], "Backend"), new([], "")).Score, 0), "Empty JD title cannot earn position bonus");
Check(Near(ContentBasedMatcher.EvaluateBaseline(new([new(null, "Docker")], "Backend", 20, "Hà Nội"),
    new([new(null, "Docker", MucDoYC.BatBuc)], "Backend", 15, 25, "Hà Nội")).Score, 1), "Final score capped at one");
Check(Near(ContentBasedMatcher.Evaluate(new([new(null, "Docker")], "Backend", 20, "Hà Nội"),
    new([new(null, "Docker", MucDoYC.BatBuc)], "Backend", 15, 25, "Hà Nội")).Score, 0.8f), "Calibrated score plus all bonuses");
Check(Near(ContentBasedMatcher.Evaluate(new([], DesiredSalary: 20), new([], SalaryMax: 0)).Score, 0), "Unknown salary does not earn salary bonus");

// Cổng bắt buộc là nhãn screening: nó liệt kê thiếu gì nhưng không được sửa Score,
// vì màn gợi ý việc làm chấm điểm trên chính Score và đang chạy thật.
var gated = ContentBasedMatcher.Evaluate(Candidate("JS"), new JobMatchInput([
    new(null, "JavaScript", MucDoYC.BatBuc), new(null, "Docker", MucDoYC.BatBuc),
    new(null, "Figma", MucDoYC.UuTien)]));
Check(gated.MissingMandatory.SequenceEqual(["Docker"]) && !gated.MeetsMandatory, "Gate names only uncovered BatBuc skills");
Check(Near(gated.Score, .3846154f), "Gate leaves the score untouched");
Check(ContentBasedMatcher.Evaluate(Candidate("JS", "Docker"), new JobMatchInput([
    new(null, "JavaScript", MucDoYC.BatBuc), new(null, "Docker", MucDoYC.BatBuc)])).MeetsMandatory, "Covering every mandatory skill passes the gate");
Check(ContentBasedMatcher.Evaluate(new([], "Backend"), new([], "Backend Developer", 15, 25, "Hà Nội")).MeetsMandatory, "JD without mandatory skills passes");
Check(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JS", MucDo.CoBan)), Job("JavaScript")).MeetsMandatory, "Beginner proficiency still clears the gate");
Check(ContentBasedMatcher.EvaluateBaseline(Candidate("JS"), new JobMatchInput([
    new(null, "JavaScript", MucDoYC.BatBuc), new(null, "Docker", MucDoYC.BatBuc)])).MissingMandatory.SequenceEqual(["JavaScript", "Docker"]),
    "Baseline gate keeps the original alias miss");
Check(MatchingTextNormalizer.LocationKey("TP. Hồ Chí Minh") == "tp hồ chí minh", "Location key drops punctuation");
Check(MatchingTextNormalizer.LocationKey(null) == "", "Null location is empty");
Check(MatchingTextNormalizer.SkillKey("C#") != MatchingTextNormalizer.SkillKey("C"), "Skill key keeps punctuation that names the language");
var dottedAddress = ContentBasedMatcher.Evaluate(new([], "", 0, "766/5 Lạc Long Quân, Tân Hòa, TP Hồ Chí Minh"),
    new([], "Senior .NET Developer", 25, 45, "TP. Hồ Chí Minh"));
Check(Near(dottedAddress.LocationBonus, .025) && Near(dottedAddress.Score, .025), "City match without district earns half the bonus");
Check(Near(ContentBasedMatcher.Evaluate(new([], "", 0, "Quận 1, TP. Hồ Chí Minh"),
    new([], "Developer", 0, 0, "Bình Thạnh, TP. Hồ Chí Minh")).LocationBonus, .025), "Different district in the same city is not a full location match");
Check(Near(ContentBasedMatcher.Evaluate(new([], "", 0, "Quận 1, TP. Hồ Chí Minh"),
    new([], "Developer", 0, 0, "Quận 1, Hồ Chí Minh")).LocationBonus, .05), "Same district inside the same city earns the full bonus");
var baselineDottedAddress = ContentBasedMatcher.EvaluateBaseline(new([], "", 0, "766/5 Lạc Long Quân, Tân Hòa, TP Hồ Chí Minh"),
    new([], "Senior .NET Developer", 25, 45, "TP. Hồ Chí Minh"));
Check(Near(baselineDottedAddress.LocationBonus, 0), "Baseline keeps the original punctuation miss");
Check(Near(ContentBasedMatcher.Evaluate(new([], "", 0, "Cầu Giấy, Hà Nội"),
    new([], "Data Analyst", 12, 20, "TP. Hồ Chí Minh")).LocationBonus, 0), "Different city earns no location bonus");

// Utility so nam: 0.05*du, -0.05*thieu het, 0 o giua; thieu du lieu hai ben thi trung tinh.
float Experience(float? years, string required) => ContentBasedMatcher.Evaluate(
    Graded(Skill(null, "JavaScript", null, years)),
    new JobMatchInput([new(null, "JavaScript", MucDoYC.BatBuc)], ExperienceRequired: required)).ExperienceBonus;
Check(Near(Experience(4f, "4 năm"), .05), "Meeting the required years earns the experience bonus");
Check(Near(Experience(9f, "4 năm"), .05), "More years than required does not overshoot the bonus");
Check(Near(Experience(2f, "4 năm"), 0), "Half the required years is exactly neutral");
Check(Near(Experience(.5f, "4 năm"), -.0375f), "Under-experience is penalized proportionally");
Check(Near(Experience(1f, "Tối thiểu 1-3 năm kinh nghiệm ở vị trí tương đương."), .05), "Requirement range uses its lower bound");
Check(Near(Experience(3f, "Tối thiểu 3 năm kinh nghiệm phát triển .NET/.NET Core; có kinh nghiệm EF Core, SQL Server."), .05), "Requirement number survives dotted skill names");
Check(Near(Experience(null, "5 năm"), 0), "CV without any years is not guessed as inexperienced");
Check(Near(Experience(1f, "Không yêu cầu kinh nghiệm"), 0), "JD without a requirement cannot move the score");
Check(Near(Experience(1f, "0 - 1 năm (chấp nhận sinh viên năm cuối)"), 0), "Zero lower bound is read as no requirement");
Check(Near(ContentBasedMatcher.EvaluateBaseline(Graded(Skill(null, "JavaScript", null, 1f)),
    new JobMatchInput([new(null, "JavaScript", MucDoYC.BatBuc)], ExperienceRequired: "5 năm")).ExperienceBonus, 0),
    "Baseline ignores the experience requirement");
// Bonus am khong duoc xoa mot cap co it nhat mot yeu cau khop: bo loc "score > 0"
// cua API va fan-out dung chinh gia tri nay de quyet tin/ung vien duoc goi.
Check(ContentBasedMatcher.Evaluate(Graded(Skill(null, "JavaScript", MucDo.CoBan)),
    new JobMatchInput([new(null, "JavaScript", MucDoYC.KhongBatBuoc)], ExperienceRequired: "20 năm")).Score > 0,
    "Maximum experience penalty cannot delete a CV that matches one requirement");
var originalCulture = CultureInfo.CurrentCulture;
try
{
    CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("tr-TR");
    Check(MatchingTextNormalizer.SkillKey("JAVASCRIPT") == "javascript", "Keys are independent of server culture");
}
finally { CultureInfo.CurrentCulture = originalCulture; }
Check(RecommendationCache.JobRecommendationsKey(1, 2, "cv", "jobs", 10).Contains(ContentBasedMatcher.Version), "Job cache includes model version");
Check(RecommendationCache.CandidateRecommendationsKey(1, 2, "jobs", "pool", 10).Contains(ContentBasedMatcher.Version), "Candidate cache includes model version");

var labels = new Dictionary<string, int> { ["a"] = 3, ["b"] = 1, ["c"] = 0 };
var ideal = RankingMetrics.AtK(["a", "b"], labels, 2);
Check(Near(ideal.Precision, 1) && Near(ideal.Recall, 1) && Near(ideal.Ndcg, 1), "Ideal ranking metrics");
var shortRanking = RankingMetrics.AtK(["a"], labels, 2);
Check(Near(shortRanking.Precision, .5) && Near(shortRanking.Recall, .5), "Short rankings penalize missing slots");
Check(RankingMetrics.AtK(["b", "a"], labels, 2).Ndcg < 1, "NDCG penalizes wrong graded order");
Check(Near(RankingMetrics.AtK([], new Dictionary<string, int>(), 2).Ndcg, 0), "No relevant items has defined zero metrics");
try { RankingMetrics.AtK(["a", "a"], labels, 2); throw new Exception("Duplicate ranking accepted"); }
catch (ArgumentException) { Check(true, "Duplicate predictions rejected"); }
try { RankingMetrics.AtK(["unknown"], labels, 2); throw new Exception("Unjudged prediction accepted"); }
catch (ArgumentException) { Check(true, "Unjudged items cannot silently become negative labels"); }

await QueryChecks.RunAsync(Check);
await FanoutChecks.RunAsync(Check);
await RerankChecks.RunAsync(Check);

var fixturePath = args.Length > 0 ? args[0] : Path.Combine(AppContext.BaseDirectory, "fixtures.json");
var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
options.Converters.Add(new JsonStringEnumConverter());
var fixtures = JsonSerializer.Deserialize<List<EvaluationCase>>(await File.ReadAllTextAsync(fixturePath), options)
    ?? throw new Exception("Missing evaluation cases.");
if (fixtures.Count == 0 || fixtures.Any(x => x.K <= 0 || x.Items.Count == 0 || string.IsNullOrWhiteSpace(x.Id)) ||
    fixtures.Select(x => x.Id).Distinct().Count() != fixtures.Count)
    throw new Exception("Evaluation cases need unique IDs, positive K and labeled items.");

foreach (var model in new[] { ContentBasedMatcher.BaselineVersion, ContentBasedMatcher.Version })
{
    var metrics = new List<RankingResult>();
    var positive = 0;
    var gateFailed = 0;
    foreach (var fixture in fixtures)
    {
        var relevance = fixture.Items.ToDictionary(x => x.Id, x => x.Relevance, StringComparer.Ordinal);
        // Fixture nao khai bao Corpus thi moi dung IDF; cac ca con lai chay dung luat buoc #1-#4.
        var corpus = fixture.Corpus is null ? null : SkillCorpus.BuildFromFrequencies(
            fixture.CorpusPostings ?? throw new Exception($"{fixture.Id} needs CorpusPostings"), fixture.Corpus);
        var scored = fixture.Items.Select(item => (item.Id, Match: model == ContentBasedMatcher.BaselineVersion
            ? ContentBasedMatcher.EvaluateBaseline(fixture.Candidate, item.Job)
            : ContentBasedMatcher.Evaluate(fixture.Candidate, item.Job, corpus)))
            .Where(x => x.Match.Score > 0).ToList();
        positive += scored.Count;
        gateFailed += scored.Count(x => !x.Match.MeetsMandatory);
        var ranking = scored.OrderByDescending(x => x.Match.Score)
            .ThenBy(x => x.Id, StringComparer.Ordinal).Take(fixture.K).Select(x => x.Id).ToList();
        var result = RankingMetrics.AtK(ranking, relevance, fixture.K);
        metrics.Add(result);
        Console.WriteLine(FormattableString.Invariant($"EVAL {model} {fixture.Id} K={fixture.K} P={result.Precision:F4} R={result.Recall:F4} NDCG={result.Ndcg:F4} IDs={string.Join(',', ranking)}"));
    }
    Console.WriteLine(FormattableString.Invariant($"MACRO {model} queries={metrics.Count} P={metrics.Average(x => x.Precision):F4} R={metrics.Average(x => x.Recall):F4} NDCG={metrics.Average(x => x.Ndcg):F4}"));
    Console.WriteLine(FormattableString.Invariant($"GATE {model} positive={positive} thieuBatBuoc={gateFailed}"));
}
Console.WriteLine($"Recommendation matching checks completed: {checks} passed. Fixtures are synthetic diagnostics, not real-user effectiveness measurements.");

sealed record EvaluationCase(string Id, CandidateMatchInput Candidate, int K, List<EvaluationItem> Items,
    Dictionary<string, int>? Corpus = null, int? CorpusPostings = null);
sealed record EvaluationItem(string Id, JobMatchInput Job, int Relevance);
