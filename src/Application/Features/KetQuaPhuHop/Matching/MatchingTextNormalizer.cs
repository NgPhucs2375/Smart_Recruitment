#nullable enable
using System.Text;

namespace Application.Features.KetQuaPhuHop.Matching;

/// <summary>Comparison keys only: original CV/JD text remains available as evidence.</summary>
public static class MatchingTextNormalizer
{
    /// <summary>
    /// Từ điển alias kiểm soát. Mỗi dòng ở đây tương ứng một biến thể chữ thật đã thấy trong
    /// dữ liệu đang chạy (CV viết "ML"/"Node"/".NET Core"/"CI/CD", danh mục và JD viết
    /// "Machine Learning"/"Node.js"/".NET"/"CI CD"), không phải biến thể tưởng tượng ra.
    /// Không có alias nào ánh xạ "React Native" về "React": chuỗi con không phải bằng chứng.
    /// </summary>
    private static readonly Dictionary<string, string> SkillAliases = new(StringComparer.Ordinal)
    {
        ["js"] = "javascript", ["ecmascript"] = "javascript",
        ["ts"] = "typescript",
        ["node"] = "node.js", ["nodejs"] = "node.js", ["node js"] = "node.js",
        ["express"] = "express.js", ["expressjs"] = "express.js", ["express js"] = "express.js",
        ["reactjs"] = "react", ["react.js"] = "react", ["react js"] = "react",
        ["vuejs"] = "vue.js", ["vue js"] = "vue.js",
        ["nextjs"] = "next.js", ["next js"] = "next.js",
        ["nuxtjs"] = "nuxt.js",
        ["c sharp"] = "c#", ["csharp"] = "c#",
        ["cpp"] = "c++", ["cplusplus"] = "c++",
        ["dotnet"] = ".net", ["dot net"] = ".net", [".net core"] = ".net", [".netcore"] = ".net",
        ["aspnet core"] = "asp.net core", ["asp net core"] = "asp.net core",
        ["ci/cd"] = "ci cd", ["cicd"] = "ci cd",
        ["postgres"] = "postgresql", ["postgre sql"] = "postgresql",
        ["mssql"] = "sql server", ["microsoft sql server"] = "sql server",
        ["k8s"] = "kubernetes",
        ["golang"] = "go",
        ["ml"] = "machine learning", ["m/l"] = "machine learning",
        ["dl"] = "deep learning",
        ["html5"] = "html", ["css3"] = "css"
    };

    public static string TextKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var result = new StringBuilder();
        var pendingSpace = false;
        foreach (var ch in value.Normalize(NormalizationForm.FormKC))
        {
            if (char.IsWhiteSpace(ch))
            {
                pendingSpace = result.Length > 0;
                continue;
            }
            if (pendingSpace) result.Append(' ');
            result.Append(char.ToLowerInvariant(ch));
            pendingSpace = false;
        }
        return result.ToString();
    }

    public static string SkillKey(string? value)
    {
        var key = TextKey(value);
        return SkillAliases.GetValueOrDefault(key, key);
    }

    /// <summary>Biến thể viết thật của một kỹ năng: key chuẩn cộng mọi alias trỏ về nó.</summary>
    private static readonly Dictionary<string, string[]> AliasVariants = SkillAliases
        .GroupBy(x => x.Value, StringComparer.Ordinal)
        .ToDictionary(g => g.Key, g => g.Select(x => x.Key).ToArray(), StringComparer.Ordinal);

    /// <summary>
    /// Kỹ năng cụ thể bao hàm kỹ năng chung (key của yêu cầu → các key làm bằng chứng).
    /// Kinh nghiệm SQL Server là bằng chứng cho yêu cầu "SQL", nhưng tag "SQL" không
    /// chứng minh kinh nghiệm vận hành SQL Server nên chỉ phủ một chiều. PostgreSQL
    /// không có trong bảng: nó là sản phẩm khác, không phải cách viết khác. Key vẫn
    /// giữ nguyên nên IDF, gộp yêu cầu trùng và cache không đổi nghĩa.
    /// </summary>
    private static readonly Dictionary<string, string[]> SkillCoverage = new(StringComparer.Ordinal)
    {
        ["sql"] = ["sql server"],
        ["git"] = ["github"],
    };

    /// <summary>Bằng chứng <paramref name="evidenceKey"/> có phủ được yêu cầu <paramref name="requirementKey"/>?</summary>
    public static bool SkillCovers(string requirementKey, string evidenceKey) =>
        SkillCoverage.TryGetValue(requirementKey, out var evidenceKeys) &&
        evidenceKeys.Contains(evidenceKey, StringComparer.Ordinal);

    /// <summary>
    /// Tìm kỹ năng trong chữ tự do (mô tả kinh nghiệm/dự án). So theo ranh giới từ để
    /// "Go" không khớp "Google" và "Java" không nuốt "JavaScript"; chấp nhận alias
    /// (ML = machine learning, dotnet = .NET) vì đó là biến thể đã gặp trong dữ liệu CV.
    /// </summary>
    public static bool ContainsSkill(string textKey, string? skillName)
    {
        if (textKey.Length == 0 || string.IsNullOrWhiteSpace(skillName)) return false;
        var key = SkillKey(skillName);
        if (key.Length == 0) return false;
        if (ContainsWholePhrase(textKey, key)) return true;
        if (AliasVariants.TryGetValue(key, out var variants) &&
            variants.Any(variant => ContainsWholePhrase(textKey, variant)))
            return true;
        // "Dự án dùng SQL Server 2019" là bằng chứng cho yêu cầu "SQL"; "GitHub Actions" cho "Git".
        return SkillCoverage.TryGetValue(key, out var covering) &&
               covering.Any(evidence => ContainsWholePhrase(textKey, evidence) ||
                   AliasVariants.TryGetValue(evidence, out var evidenceVariants) &&
                   evidenceVariants.Any(variant => ContainsWholePhrase(textKey, variant)));
    }

    private static bool ContainsWholePhrase(string text, string phrase)
    {
        var start = 0;
        while (true)
        {
            var index = text.IndexOf(phrase, start, StringComparison.Ordinal);
            if (index < 0) return false;
            // Cạnh của phrase là ký hiệu (".net", "c#") thì không đòi ranh giới ở phía đó,
            // để "ASP.NET" vẫn là bằng chứng cho ".NET".
            var leftOk = index == 0 || !char.IsLetterOrDigit(phrase[0]) ||
                         !char.IsLetterOrDigit(text[index - 1]);
            var end = index + phrase.Length;
            var rightOk = end >= text.Length || !char.IsLetterOrDigit(phrase[^1]) ||
                          !char.IsLetterOrDigit(text[end]);
            if (leftOk && rightOk) return true;
            start = index + 1;
        }
    }


    /// <summary>
    /// Key so địa chỉ: dấu câu không phải tín hiệu phân biệt nên "TP. Hồ Chí Minh"
    /// và "TP Hồ Chí Minh" phải quy về một. Chỉ dùng cho phần địa điểm — kỹ năng
    /// vẫn giữ dấu câu vì "C#", ".NET", "Node.js" phân biệt nhau bằng ký hiệu.
    /// </summary>
    public static string LocationKey(string? value)
    {
        var key = TextKey(value);
        if (key.Length == 0) return string.Empty;
        var result = new StringBuilder(key.Length);
        var pendingSpace = false;
        foreach (var ch in key)
        {
            if (char.IsWhiteSpace(ch) || !char.IsLetterOrDigit(ch))
            {
                if (result.Length > 0) pendingSpace = true;
                continue;
            }
            if (pendingSpace) result.Append(' ');
            result.Append(ch);
            pendingSpace = false;
        }
        return result.ToString();
    }
}
