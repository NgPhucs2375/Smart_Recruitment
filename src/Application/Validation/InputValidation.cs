using System.Text.RegularExpressions;

namespace Application.Validation;

public static class InputValidation
{
    public const string VietnameseMobilePhonePattern = @"^0(3|5|7|8|9)\d{8}$";
    private static readonly Regex VietnameseMobilePhone = new(VietnameseMobilePhonePattern, RegexOptions.Compiled);
    private static readonly Regex Email = new(@"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$", RegexOptions.Compiled);

    public static bool IsVietnameseMobilePhone(string? value) =>
        !string.IsNullOrWhiteSpace(value) && VietnameseMobilePhone.IsMatch(value.Trim());

    public static bool IsEmail(string? value)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrEmpty(normalized) || normalized.Length > 100 || !Email.IsMatch(normalized) || normalized.Contains(".."))
            return false;

        var parts = normalized.Split('@');
        return parts.Length == 2
            && !string.IsNullOrEmpty(parts[0])
            && !string.IsNullOrEmpty(parts[1])
            && !Regex.IsMatch(parts[0], @"^[.-]|[.-]$")
            && !Regex.IsMatch(parts[1], @"^[.-]|[.-]$");
    }
}
