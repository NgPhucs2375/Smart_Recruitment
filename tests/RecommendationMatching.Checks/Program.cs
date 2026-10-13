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
Check(Near(ContentBasedMatcher.EvaluateBaseline(Candidate("JS"), Job("JavaScript")).Score, 0), "Baseline preserves original alias miss");
Check(Near(ContentBasedMatcher.Evaluate(Candidate("JS"), Job("JavaScript")).Score, 1), "Normalized matcher recognizes exact alias");
Check(Near(ContentBasedMatcher.Evaluate(Candidate("Java"), Job("JavaScript")).Score, 0), "No substring skill matching");

var weighted = new JobMatchInput([
    new(null, "JavaScript", MucDoYC.BatBuc), new(null, "Docker", MucDoYC.UuTien),
    new(null, "Kubernetes", MucDoYC.KhongBatBuoc)]);
var partial = ContentBasedMatcher.Evaluate(Candidate("JS"), weighted);
Check(Near(partial.SkillScore, .5), "Required/preferred/optional weights are 3/2/1");
Check(partial.MatchedSkills.SequenceEqual(["JavaScript"]) && partial.MissingSkills.SequenceEqual(["Docker", "Kubernetes"]), "Evidence uses original requirement names");
Check(Near(ContentBasedMatcher.Evaluate(Candidate("JS", "JavaScript", "JS"), weighted).Score, partial.Score), "Duplicate CV skills do not inflate score");
var duplicateRequirements = new JobMatchInput([
    new(null, "JS", MucDoYC.KhongBatBuoc), new(null, "JavaScript", MucDoYC.BatBuc),
    new(null, "Docker", MucDoYC.BatBuc)]);
var dedup = ContentBasedMatcher.Evaluate(Candidate("JS"), duplicateRequirements);
Check(Near(dedup.Score, .5) && dedup.MatchedSkills.SequenceEqual(["JavaScript"]), "Duplicate JD aliases retain strongest requirement");
Check(Near(ContentBasedMatcher.Evaluate(new([new(7, "")]), new([new(7, "Docker", MucDoYC.BatBuc)])).Score, 1), "Catalog ID can match without CV skill text");
Check(Near(ContentBasedMatcher.Evaluate(Candidate(""), Job(" ")).Score, 0), "Blank requirements do not score");

var bonuses = ContentBasedMatcher.Evaluate(new([], "Backend", 20, "Hà Nội"),
    new([], "Backend Developer", 15, 25, "Hà Nội"));
Check(Near(bonuses.Score, .2) && Near(bonuses.SkillScore, 0), "Bonuses exposed separately from skill score");
Check(Near(ContentBasedMatcher.Evaluate(new([], "Backend"), new([], "")).Score, 0), "Empty JD title cannot earn position bonus");
Check(Near(ContentBasedMatcher.Evaluate(new([new(null, "Docker")], "Backend", 20, "Hà Nội"),
    new([new(null, "Docker", MucDoYC.BatBuc)], "Backend", 15, 25, "Hà Nội")).Score, 1), "Final score capped at one");
Check(Near(ContentBasedMatcher.Evaluate(new([], DesiredSalary: 20), new([], SalaryMax: 0)).Score, 0), "Unknown salary does not earn salary bonus");
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
    foreach (var fixture in fixtures)
    {
        var relevance = fixture.Items.ToDictionary(x => x.Id, x => x.Relevance, StringComparer.Ordinal);
        var ranking = fixture.Items.Select(item => new
        {
            item.Id,
            Match = model == ContentBasedMatcher.BaselineVersion
                ? ContentBasedMatcher.EvaluateBaseline(fixture.Candidate, item.Job)
                : ContentBasedMatcher.Evaluate(fixture.Candidate, item.Job)
        }).Where(x => x.Match.Score > 0).OrderByDescending(x => x.Match.Score)
            .ThenBy(x => x.Id, StringComparer.Ordinal).Take(fixture.K).Select(x => x.Id).ToList();
        var result = RankingMetrics.AtK(ranking, relevance, fixture.K);
        metrics.Add(result);
        Console.WriteLine(FormattableString.Invariant($"EVAL {model} {fixture.Id} K={fixture.K} P={result.Precision:F4} R={result.Recall:F4} NDCG={result.Ndcg:F4} IDs={string.Join(',', ranking)}"));
    }
    Console.WriteLine(FormattableString.Invariant($"MACRO {model} queries={metrics.Count} P={metrics.Average(x => x.Precision):F4} R={metrics.Average(x => x.Recall):F4} NDCG={metrics.Average(x => x.Ndcg):F4}"));
}
Console.WriteLine($"Recommendation matching checks completed: {checks} passed. Fixtures are synthetic diagnostics, not real-user effectiveness measurements.");

sealed record EvaluationCase(string Id, CandidateMatchInput Candidate, int K, List<EvaluationItem> Items);
sealed record EvaluationItem(string Id, JobMatchInput Job, int Relevance);
