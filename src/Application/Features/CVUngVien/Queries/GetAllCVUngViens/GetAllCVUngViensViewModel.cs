using Domain.Enums;

namespace Application.Features.CVUngVien.Queries.GetAllCVUngViens;

public class GetAllCVUngViensViewModel
{
    public int Id { get; set; }

    public int HoSoUngVienId { get; set; }

    public string TenFile { get; set; }

    public string? FileUrl { get; set; }

    public bool IsDefault { get; set; }

    public string? TemplateId { get; set; }

    public PhuongThucTaoCV PhuongThucTao { get; set; }

    public string? ViTriUngTuyen { get; set; }

    public string? HoTen { get; set; }
}
