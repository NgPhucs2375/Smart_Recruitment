using Domain.Enums;

namespace Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;

/// <summary>Nhãn tiếng Việt cho trạng thái, dùng chung cho ViewModel và file CSV xuất ra.</summary>
public static class BaoCaoLabels
{
    public static string NhanTrangThaiDon(int trangThaiId) => (TrangThaiDonUngTuyen)trangThaiId switch
    {
        TrangThaiDonUngTuyen.KhoiTao => "Khởi tạo",
        TrangThaiDonUngTuyen.LoiXuLyHoSo => "Lỗi xử lý",
        TrangThaiDonUngTuyen.ChoXuLy => "Chờ xử lý",
        TrangThaiDonUngTuyen.DaXem => "Đã xem",
        TrangThaiDonUngTuyen.UngVienRutDon => "Ứng viên rút đơn",
        TrangThaiDonUngTuyen.PhuHop => "Phù hợp",
        TrangThaiDonUngTuyen.TuChoi => "Từ chối",
        TrangThaiDonUngTuyen.QuaHanXuLy => "Quá hạn",
        TrangThaiDonUngTuyen.TinTuyenDungBiDong => "Tin đã đóng",
        TrangThaiDonUngTuyen.VoHieuHoa => "Vô hiệu hóa",
        _ => $"Trạng thái {trangThaiId}"
    };

    public static string NhanTrangThaiTin(int trangThaiId) => (TrangThaiTinTuyenDung)trangThaiId switch
    {
        TrangThaiTinTuyenDung.Nhap => "Nháp",
        TrangThaiTinTuyenDung.ChoDuyetHeThong => "Hệ thống đang duyệt",
        TrangThaiTinTuyenDung.ChoAdminDuyet => "Chờ admin duyệt",
        TrangThaiTinTuyenDung.DangTuyen => "Đang tuyển",
        TrangThaiTinTuyenDung.TamDung => "Tạm dừng",
        TrangThaiTinTuyenDung.HetHan => "Hết hạn",
        TrangThaiTinTuyenDung.DaDong => "Đã đóng",
        TrangThaiTinTuyenDung.TuChoi => "Từ chối",
        TrangThaiTinTuyenDung.BiKhoa => "Bị khóa",
        TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet => "Chờ người đại diện",
        _ => $"Trạng thái {trangThaiId}"
    };
}
