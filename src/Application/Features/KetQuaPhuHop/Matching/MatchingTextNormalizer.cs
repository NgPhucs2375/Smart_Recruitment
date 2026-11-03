#nullable enable
using System.Text;

namespace Application.Features.KetQuaPhuHop.Matching;

/// <summary>Comparison keys only: original CV/JD text remains available as evidence.</summary>
public static class MatchingTextNormalizer
{
    private static readonly Dictionary<string, string> SkillAliases = new(StringComparer.Ordinal)
    {
        ["js"] = "javascript", ["ecmascript"] = "javascript",
        ["ts"] = "typescript",
        ["nodejs"] = "node.js", ["node js"] = "node.js",
        ["reactjs"] = "react", ["react.js"] = "react", ["react js"] = "react",
        ["vuejs"] = "vue.js", ["vue js"] = "vue.js",
        ["nextjs"] = "next.js", ["next js"] = "next.js",
        ["c sharp"] = "c#", ["csharp"] = "c#",
        ["cpp"] = "c++", ["cplusplus"] = "c++",
        ["dotnet"] = ".net", ["dot net"] = ".net",
        ["aspnet core"] = "asp.net core", ["asp net core"] = "asp.net core",
        ["postgres"] = "postgresql",
        ["mssql"] = "sql server", ["microsoft sql server"] = "sql server",
        ["k8s"] = "kubernetes",
        ["golang"] = "go",
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
