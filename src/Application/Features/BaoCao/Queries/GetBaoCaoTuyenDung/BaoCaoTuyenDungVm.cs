namespace Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;

public class BaoCaoTuyenDungVm
{
    public DateTime GeneratedAtUtc { get; set; }
    public int KyNgay { get; set; }
    /// <summary>"he-thong" với QUAN_TRI_VIEN, "doanh-nghiep" với NGUOI_DAI_DIEN / NHAN_SU.</summary>
    public string PhamVi { get; set; } = "";
    public int TinDaDang { get; set; }
    public int? TinKyTruoc { get; set; }
    public double? TyLeTin { get; set; }
    public int LuotNop { get; set; }
    public int? LuotNopKyTruoc { get; set; }
    public double? TyLeNop { get; set; }
    public int UngVienDuyNhat { get; set; }
    public List<KetQuaTheoTrangThaiVm> KetQua { get; set; } = new();
    public List<DiemXuHuongVm> XuHuong { get; set; } = new();
    public List<TinNhieuDonVm> TopTin { get; set; } = new();
    public DuyetTinVm DuyetTin { get; set; } = new();
    public List<PheBuocVm> PheBuoc { get; set; } = new();
    public ThoiGianXuLyVm ThoiGianXuLy { get; set; } = new();
    public ChatLuongGoiYVm ChatLuongGoiY { get; set; } = new();
    public List<HieuSuatNhanSuVm> HieuSuatNhanSu { get; set; } = new();
}

public class KetQuaTheoTrangThaiVm
{
    public int TrangThaiId { get; set; }
    public string TrangThai { get; set; } = "";
    public int SoLuong { get; set; }
}

public class DiemXuHuongVm
{
    /// <summary>Ngày dạng yyyy-MM-dd.</summary>
    public string Ngay { get; set; } = "";
    public int SoLuong { get; set; }
}

public class TinNhieuDonVm
{
    public int Id { get; set; }
    public string TieuDe { get; set; } = "";
    public int TrangThaiId { get; set; }
    public string TrangThai { get; set; } = "";
    public int SoDon { get; set; }
}

public class DuyetTinVm
{
    public int DaDuyet { get; set; }
    public int ChoDuyet { get; set; }
    public int TuChoi { get; set; }
    public int Nhap { get; set; }
    /// <summary>DaDuyet / (DaDuyet + TuChoi) * 100. Null khi chưa có tin nào được quyết định.</summary>
    public double? TyLeDuyet { get; set; }
}

/// <summary>Một bước của phễu tuyển dụng, đếm số đơn đã từng chạm tới bước đó.</summary>
public class PheBuocVm
{
    public int TrangThaiId { get; set; }
    public string TrangThai { get; set; } = "";
    public int SoDon { get; set; }
    /// <summary>SoDon / LuotNop * 100, một chữ số thập phân.</summary>
    public double TyLe { get; set; }
}

public class ThoiGianXuLyVm
{
    /// <summary>Số đơn có ít nhất một lần đổi trạng thái thật (bỏ qua dòng mốc).</summary>
    public int DonCoLichSu { get; set; }
    /// <summary>TB số ngày từ lúc nộp đến lần phản hồi đầu tiên. Null khi chưa có đơn nào được phản hồi.</summary>
    public double? TgPhanHoiDauTbNgay { get; set; }
    /// <summary>TB số ngày từ lúc nộp đến lần ra quyết định (Phù hợp / Từ chối). Null khi chưa có quyết định.</summary>
    public double? TgQuyetDinhTbNgay { get; set; }
    /// <summary>Đơn còn mở (Khởi tạo / Lỗi xử lý / Chờ xử lý / Đã xem) quá 7 ngày không đổi trạng thái.</summary>
    public int DonTreoQua7Ngay { get; set; }
}

public class ChatLuongGoiYVm
{
    public int TongKetQua { get; set; }
    /// <summary>Điểm phù hợp trung bình theo thang 100. Null khi chưa có kết quả nào.</summary>
    public double? DiemTrungBinh { get; set; }
    /// <summary>Tỷ lệ kết quả có điểm >= 0,7 theo thang 100. Null khi chưa có kết quả nào.</summary>
    public double? TyLeCao { get; set; }
    public List<KyNangThieuVm> TopKyNangThieu { get; set; } = new();
}

public class KyNangThieuVm
{
    public string Ten { get; set; } = "";
    public int SoLuot { get; set; }
}

public class HieuSuatNhanSuVm
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = "";
    public int DonDaXuLy { get; set; }
    public int DonPhuHop { get; set; }
    public int DonTuChoi { get; set; }
    /// <summary>TB số ngày từ lúc nộp đến lần đổi trạng thái gần nhất của đơn người này xử lý.</summary>
    public double? TgXuLyTbNgay { get; set; }
}
