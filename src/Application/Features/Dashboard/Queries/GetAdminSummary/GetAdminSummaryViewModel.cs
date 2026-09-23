namespace Application.Features.Dashboard.Queries.GetAdminSummary;

public class DayPoint
{
    public string Ngay { get; set; }
    public int SoLuong { get; set; }
}

public class PendingPostItem
{
    public int Id { get; set; }
    public string TieuDe { get; set; }
    public string TrangThai { get; set; }
    public DateTime Created { get; set; }
    public string TenDoanhNghiep { get; set; }
}

public class RecentApplicationItem
{
    public int Id { get; set; }
    public string TinTieuDe { get; set; }
    public DateTime? NgayUngTuyen { get; set; }
    public string TrangThai { get; set; }
}

public class GetAdminSummaryViewModel
{
    public int TongNguoiDung { get; set; }
    public int SoUngVien { get; set; }
    public int SoNhaTuyenDung { get; set; }
    public int TongTinTuyenDung { get; set; }
    public int TinChoDuyet { get; set; }
    public int TongCV { get; set; }
    public int ThemeDangBat { get; set; }
    public List<DayPoint> TinTheoNgay { get; set; } = new();
    public List<DayPoint> DonTheoNgay { get; set; } = new();
    public List<DayPoint> NguoiDungTheoNgay { get; set; } = new();
    public List<PendingPostItem> TinChoDuyetMoiNhat { get; set; } = new();
    public List<RecentApplicationItem> DonMoiNhat { get; set; } = new();
}
