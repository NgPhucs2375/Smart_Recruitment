using System;

namespace Domain.Common;

/// <summary>Recruitment dates are inclusive calendar days in Vietnam (UTC+7).</summary>
public static class RecruitmentDeadline
{
    public static DateTime Today => DateTime.UtcNow.AddHours(7).Date;
    public static DateTime? FromDate(DateTime? date) => date.HasValue
        ? DateTime.SpecifyKind(date.Value.Date.AddDays(1).AddHours(-7), DateTimeKind.Utc)
        : null;
    public static bool IsOpen(DateTime? deadline) => !deadline.HasValue || deadline.Value > DateTime.UtcNow;
}
