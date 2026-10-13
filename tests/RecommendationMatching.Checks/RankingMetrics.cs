namespace RecommendationMatching.Checks;

public sealed record RankingResult(double Precision, double Recall, double Ndcg);

public static class RankingMetrics
{
    /// <summary>Positive grade = relevant. Missing ranks count as misses in Precision@K.</summary>
    public static RankingResult AtK(IReadOnlyList<string> ranking, IReadOnlyDictionary<string, int> labels, int k)
    {
        if (k <= 0) throw new ArgumentOutOfRangeException(nameof(k));
        if (labels.Values.Any(x => x is < 0 or > 3))
            throw new ArgumentException("Relevance grades must be between 0 and 3.", nameof(labels));
        if (ranking.Distinct(StringComparer.Ordinal).Count() != ranking.Count)
            throw new ArgumentException("Ranking contains duplicate IDs.", nameof(ranking));
        if (ranking.Any(x => !labels.ContainsKey(x)))
            throw new ArgumentException("Every ranked item must have an explicit relevance label.", nameof(labels));

        var grades = ranking.Take(k).Select(x => labels[x]).ToList();
        var hits = grades.Count(x => x > 0);
        var relevantCount = labels.Values.Count(x => x > 0);
        var dcg = Dcg(grades);
        var ideal = Dcg(labels.Values.OrderByDescending(x => x).Take(k));
        return new RankingResult((double)hits / k,
            relevantCount == 0 ? 0 : (double)hits / relevantCount, ideal == 0 ? 0 : dcg / ideal);
    }

    private static double Dcg(IEnumerable<int> grades) =>
        grades.Select((grade, index) => (Math.Pow(2, grade) - 1) / Math.Log2(index + 2)).Sum();
}
