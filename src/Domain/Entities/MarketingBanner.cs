using Domain.Common;

namespace Domain.Entities;

public class MarketingBanner : AuditableBaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MediaObjectName { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
