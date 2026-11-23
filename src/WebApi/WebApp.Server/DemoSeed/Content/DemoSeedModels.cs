using Domain.Enums;

namespace WebApp.Server.DemoSeed.Content;

/// <summary>Doanh nghiệp đã tồn tại trong DB (do DefaultBulkTestAccounts seed theo MST).</summary>
internal sealed record DemoCompanyContent(
    string TaxCode,
    string FallbackName,
    string Description,
    string Industry,
    string Size,
    string Address,
    string Website,
    string ProductContext,
    string[] Benefits);

/// <summary>Kỹ năng nghiệp vụ bổ sung cho những ngành ngoài danh mục CNTT mặc định.</summary>
internal sealed record DemoSkillSeed(string Name, string Description);

/// <summary>Kho nội dung theo nhóm nghề: dùng chung cho JD của tin và nội dung CV của ứng viên.</summary>
internal sealed record DemoFamily(
    string Key,
    string Position,
    string Category,
    string TemplateId,
    string Cluster,
    string Summary,
    string TeamContext,
    string Major,
    string[] Employers,
    string[] CareerTitles,
    string[] ExperienceBullets,
    string[] ProjectNames,
    string[] ProjectIntros,
    string[] Certifications,
    string[] ResponsibilityBullets,
    string[] RequirementBullets,
    (string Skill, MucDoYC Level)[] Requirements);

/// <summary>Một tin trong biên tập demo. Title + công ty là khoá tự nhiên để chạy lại không nhân bản.</summary>
internal sealed record DemoJobDef(
    string CompanyTaxCode,
    string Family,
    string Title,
    string Level,
    decimal Min,
    decimal Max,
    PhuongThucLamViec Mode,
    string Location,
    TrangThaiTinTuyenDung Status,
    int CreatedDaysAgo,
    int ExpiryInDays);

internal sealed record DemoCandidateDef(
    string HoTen,
    string Gender,
    int BirthYear,
    string City,
    string Family,
    string Level,
    float Years,
    double Salary);
