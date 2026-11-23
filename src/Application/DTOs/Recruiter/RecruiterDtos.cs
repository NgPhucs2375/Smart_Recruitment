namespace Application.DTOs.Recruiter;

public sealed class RecruitmentJobOption
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class RecruitmentJobDetail
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTaCongViec { get; set; } = string.Empty;
    public string KinhNghiemYeuCau { get; set; } = string.Empty;
    public string YeuCauCongViec { get; set; } = string.Empty;
    public string QuyenLoi { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime? NgayHetHan { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class RecruitmentApplication
{
    public int DonUngTuyenId { get; set; }
    public int TinTuyenDungId { get; set; }
    public string TieuDeTin { get; set; } = string.Empty;
    public int CVUngVienId { get; set; }
    public int HoSoUngVienId { get; set; }
    public string HoTenUngVien { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public DateTime? NgayUngTuyen { get; set; }
    public int NguoiXuLyId { get; set; }
}

public sealed class ApplicationPipelineStage
{
    public string TrangThai { get; set; } = string.Empty;
    public int SoLuong { get; set; }
}

public sealed class RecruitmentOverview
{
    public int TongTin { get; set; }
    public int TinDangTuyen { get; set; }
    public int TongDon { get; set; }
    public int DonChoXuLy { get; set; }
}

public sealed class CompanyRecruitmentStats
{
    public int TinTao30Ngay { get; set; }
    public int DonNhan30Ngay { get; set; }
    public int DonPhuHop { get; set; }
    public int DonTuChoi { get; set; }
    /// <summary>Số kết quả so khớp CV–tin được tạo trong 30 ngày qua.</summary>
    public int TongKetQuaGoiY { get; set; }
    /// <summary>Điểm phù hợp trung bình theo thang 100. Null khi chưa có kết quả.</summary>
    public double? DiemPhuHopTb { get; set; }
    /// <summary>Tỷ lệ kết quả có điểm >= 0,7 theo thang 100. Null khi chưa có kết quả.</summary>
    public double? TyLePhuHopCao { get; set; }
}

public sealed class CompanyMember
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ChucVu { get; set; } = string.Empty;
    public string VaiTro { get; set; } = string.Empty;
}

public sealed class RecruiterActivity
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public int TinDaDang { get; set; }
    public int DonDaXuLy { get; set; }
    public int DonDanhGiaPhuHop { get; set; }
    public int DonTuChoi { get; set; }
}

/// <summary>Số liệu tổng hợp cho dashboard người đại diện / nhân sự, tính trên toàn bộ dữ liệu doanh nghiệp.</summary>
public sealed class RecruiterDashboardStats
{
    public int TongTin { get; set; }
    public int TinDangTuyen { get; set; }
    public int TongDon { get; set; }
    public int UngVienDuyNhat { get; set; }
    /// <summary>Đơn đang ở Khởi tạo / Lỗi xử lý / Chờ xử lý — chưa được mở.</summary>
    public int DonChuaXem { get; set; }
    public int DonPhuHop { get; set; }
    public int TinSapHetHan7Ngay { get; set; }
    public List<RecruiterDashboardNgay> XuHuong7Ngay { get; set; } = new();
    public List<RecruiterDashboardTrangThai> DonTheoTrangThai { get; set; } = new();
    /// <summary>Chỉ người đại diện nhận danh sách này; nhân sự nhận danh sách rỗng.</summary>
    public List<RecruiterDashboardThanhVien> ThanhVien { get; set; } = new();
}

public sealed class RecruiterDashboardNgay
{
    /// <summary>Ngày dạng yyyy-MM-dd.</summary>
    public string Ngay { get; set; } = string.Empty;
    public int SoLuong { get; set; }
}

public sealed class RecruiterDashboardTrangThai
{
    public int TrangThaiId { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public int SoLuong { get; set; }
}

public sealed class RecruiterDashboardThanhVien
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ChucVu { get; set; } = string.Empty;
    public int SoTin { get; set; }
    public int SoDon { get; set; }
}
