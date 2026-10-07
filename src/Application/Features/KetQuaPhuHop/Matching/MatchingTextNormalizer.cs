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
}
