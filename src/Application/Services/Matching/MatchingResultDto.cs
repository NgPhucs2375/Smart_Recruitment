using Domain.Enums;

namespace Application.Services.Matching;

/// <summary>
/// Kết quả tính điểm phù hợp giữa 1 hồ sơ/CV và 1 tin tuyển dụng.
/// </summary>
public class MatchingResultDto
{
    public float DiemPhuHop { get; set; }

    public PhanLoaiKetQua PhanLoai { get; set; }

    public List<string> KyNangThoa { get; set; } = new();

    public List<string> KyNangThieu { get; set; } = new();

    public double DiemKyNang { get; set; }

    public double DiemKinhNghiem { get; set; }

    public double DiemHocVan { get; set; }

    public double TongSoNamKinhNghiem { get; set; }

    public bool ThanhCong { get; set; }

    public string ThongBaoLoi { get; set; }
}
