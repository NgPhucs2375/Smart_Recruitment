using Domain.Enums;

namespace WebApp.Server.DemoSeed.Content;

/// <summary>
/// Bảy mươi tin biên tập trải đều mười doanh nghiệp seed (7 tin/doanh nghiệp).
/// Trạng thái và tuổi tin được chọn để dashboard, báo cáo tuyển dụng và bộ lọc
/// công khai đều có dữ liệu: 50 tin đang tuyển, 7 chờ admin, 3 tạm dừng, 3 hết
/// hạn, 3 đã đóng, 1 chờ người đại diện, 1 bị từ chối, 1 bị khoá, 1 bản nháp.
/// </summary>
internal static class DemoJobCatalog
{
    public static readonly DemoJobDef[] All =
    [
        // ===== Sao Khuê — phần mềm / ngân hàng số (0109876501) =====
        new("0109876501", "dotnet", "Senior .NET Developer", "Senior", 30_000_000, 45_000_000,
            PhuongThucLamViec.Hybrid, "Cầu Giấy, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 12, 25),
        new("0109876501", "dotnet", ".NET Backend Developer", "Mid", 20_000_000, 30_000_000,
            PhuongThucLamViec.Onsite, "Cầu Giấy, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 20, 18),
        new("0109876501", "frontend", "Frontend Developer (React/Next.js)", "Mid", 18_000_000, 28_000_000,
            PhuongThucLamViec.Hybrid, "Cầu Giấy, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 5, 30),
        new("0109876501", "devops", "DevOps Engineer", "Mid", 25_000_000, 35_000_000,
            PhuongThucLamViec.Remote, "Toàn quốc", TrangThaiTinTuyenDung.DangTuyen, 30, 12),
        new("0109876501", "qa", "QA Engineer", "Junior", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Cầu Giấy, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 3, 35),
        new("0109876501", "fullstack", "Full-stack Developer", "Mid", 22_000_000, 32_000_000,
            PhuongThucLamViec.Hybrid, "Cầu Giấy, Hà Nội", TrangThaiTinTuyenDung.ChoAdminDuyet, 1, 40),
        new("0109876501", "dotnet", "Junior .NET Developer", "Junior", 12_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Cầu Giấy, Hà Nội", TrangThaiTinTuyenDung.Nhap, 0, 45),

        // ===== Mekong Data — nền tảng dữ liệu (0319876502) =====
        new("0319876502", "data", "Senior Data Analyst", "Senior", 25_000_000, 38_000_000,
            PhuongThucLamViec.Hybrid, "Quận 1, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 15, 20),
        new("0319876502", "data", "Kỹ sư Dữ liệu (Data Engineer)", "Mid", 22_000_000, 34_000_000,
            PhuongThucLamViec.Onsite, "Quận 1, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 8, 28),
        new("0319876502", "data", "Power BI Developer", "Mid", 18_000_000, 26_000_000,
            PhuongThucLamViec.Hybrid, "Quận 1, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 22, 15),
        new("0319876502", "fullstack", "Full-stack Developer", "Mid", 20_000_000, 30_000_000,
            PhuongThucLamViec.Remote, "Toàn quốc", TrangThaiTinTuyenDung.DangTuyen, 6, 33),
        new("0319876502", "devops", "DevOps Engineer cao cấp", "Senior", 30_000_000, 42_000_000,
            PhuongThucLamViec.Hybrid, "Quận 1, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 35, 10),
        new("0319876502", "qa", "QA Engineer", "Mid", 16_000_000, 24_000_000,
            PhuongThucLamViec.Onsite, "Quận 1, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.ChoAdminDuyet, 2, 38),
        new("0319876502", "data", "Chuyên viên Phân tích dữ liệu", "Junior", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Quận 1, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.TamDung, 18, 14),

        // ===== An Phát — phân phối hàng tiêu dùng (0319876503) =====
        new("0319876503", "sales", "Nhân viên Kinh doanh", "Mid", 12_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Tân Bình, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 4, 30),
        new("0319876503", "sales", "Giám sát Kinh doanh khu vực", "Senior", 20_000_000, 30_000_000,
            PhuongThucLamViec.Onsite, "Tân Bình, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 25, 16),
        new("0319876503", "sales", "Nhân viên Kinh doanh (Junior)", "Junior", 10_000_000, 15_000_000,
            PhuongThucLamViec.Onsite, "Biên Hoà, Đồng Nai", TrangThaiTinTuyenDung.DangTuyen, 10, 25),
        new("0319876503", "marketing", "Chuyên viên Marketing", "Mid", 15_000_000, 22_000_000,
            PhuongThucLamViec.Hybrid, "Tân Bình, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 14, 22),
        new("0319876503", "accounting", "Kế toán bán hàng", "Mid", 13_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Tân Bình, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 33, 12),
        new("0319876503", "logistics", "Điều phối Kho vận", "Mid", 14_000_000, 19_000_000,
            PhuongThucLamViec.Onsite, "Tân Bình, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.HetHan, 40, -5),
        new("0319876503", "customer-service", "Nhân viên Chăm sóc khách hàng", "Junior", 10_000_000, 14_000_000,
            PhuongThucLamViec.Onsite, "Tân Bình, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DaDong, 45, -10),

        // ===== Sao Việt Logistics (0319876504) =====
        new("0319876504", "logistics", "Chuyên viên Khai báo Hải quan", "Mid", 16_000_000, 22_000_000,
            PhuongThucLamViec.Onsite, "Thủ Đức, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 7, 28),
        new("0319876504", "logistics", "Giám sát Kho vận", "Senior", 20_000_000, 28_000_000,
            PhuongThucLamViec.Onsite, "Thủ Đức, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 18, 18),
        new("0319876504", "logistics", "Nhân viên Kho vận", "Junior", 10_000_000, 14_000_000,
            PhuongThucLamViec.Onsite, "Long An", TrangThaiTinTuyenDung.DangTuyen, 2, 35),
        new("0319876504", "sales", "Nhân viên Kinh doanh Logistics", "Mid", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Thủ Đức, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 12, 24),
        new("0319876504", "accounting", "Kế toán kho", "Mid", 12_000_000, 17_000_000,
            PhuongThucLamViec.Onsite, "Thủ Đức, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DangTuyen, 28, 14),
        new("0319876504", "customer-service", "Chuyên viên Chăm sóc khách hàng", "Mid", 12_000_000, 16_000_000,
            PhuongThucLamViec.Onsite, "Thủ Đức, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.ChoAdminDuyet, 1, 40),
        new("0319876504", "hr", "Chuyên viên Nhân sự – Tuyển dụng", "Mid", 13_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Thủ Đức, TP. Hồ Chí Minh", TrangThaiTinTuyenDung.DaDong, 48, -8),

        // ===== Pixel House — studio thiết kế (0109876505) =====
        new("0109876505", "design", "Senior UI/UX Designer", "Senior", 25_000_000, 35_000_000,
            PhuongThucLamViec.Hybrid, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 9, 26),
        new("0109876505", "design", "UI/UX Designer", "Mid", 16_000_000, 24_000_000,
            PhuongThucLamViec.Onsite, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 21, 17),
        new("0109876505", "design", "Graphic Designer", "Junior", 12_000_000, 17_000_000,
            PhuongThucLamViec.Onsite, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 3, 32),
        new("0109876505", "frontend", "Frontend Developer", "Mid", 18_000_000, 26_000_000,
            PhuongThucLamViec.Hybrid, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 16, 21),
        new("0109876505", "marketing", "Chuyên viên Marketing", "Mid", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 31, 13),
        new("0109876505", "design", "Thực tập sinh Thiết kế", "Junior", 5_000_000, 8_000_000,
            PhuongThucLamViec.Onsite, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet, 1, 40),
        new("0109876505", "hr", "Chuyên viên Nhân sự", "Mid", 13_000_000, 17_000_000,
            PhuongThucLamViec.Onsite, "Tây Hồ, Hà Nội", TrangThaiTinTuyenDung.TuChoi, 26, 10),

        // ===== Thịnh Vượng — tài chính tiêu dùng (0109876506) =====
        new("0109876506", "finance", "Chuyên viên Thẩm định Tín dụng", "Mid", 16_000_000, 24_000_000,
            PhuongThucLamViec.Onsite, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 6, 29),
        new("0109876506", "finance", "Chuyên viên Phân tích Rủi ro", "Senior", 22_000_000, 32_000_000,
            PhuongThucLamViec.Onsite, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 19, 19),
        new("0109876506", "accounting", "Kế toán tổng hợp", "Mid", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 27, 15),
        new("0109876506", "sales", "Nhân viên Kinh doanh Tài chính", "Mid", 12_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 11, 23),
        new("0109876506", "hr", "Chuyên viên Nhân sự", "Mid", 13_000_000, 18_000_000,
            PhuongThucLamViec.Hybrid, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 36, 11),
        new("0109876506", "finance", "Chuyên viên Thu hồi nợ", "Junior", 10_000_000, 15_000_000,
            PhuongThucLamViec.Onsite, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.ChoAdminDuyet, 2, 38),
        new("0109876506", "accounting", "Kế toán tổng hợp cao cấp", "Senior", 18_000_000, 26_000_000,
            PhuongThucLamViec.Onsite, "Hoàn Kiếm, Hà Nội", TrangThaiTinTuyenDung.BiKhoa, 44, -3),

        // ===== Xanh Farm — thực phẩm hữu cơ (5809876507) =====
        new("5809876507", "food", "Kỹ thuật viên Sản xuất Thực phẩm", "Mid", 12_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.DangTuyen, 5, 30),
        new("5809876507", "food", "Quản lý Chất lượng (QA/QC Thực phẩm)", "Senior", 18_000_000, 26_000_000,
            PhuongThucLamViec.Onsite, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.DangTuyen, 17, 20),
        new("5809876507", "logistics", "Nhân viên Kho vận", "Junior", 9_000_000, 13_000_000,
            PhuongThucLamViec.Onsite, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.DangTuyen, 8, 27),
        new("5809876507", "sales", "Nhân viên Kinh doanh", "Mid", 11_000_000, 17_000_000,
            PhuongThucLamViec.Onsite, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.DangTuyen, 23, 16),
        new("5809876507", "marketing", "Chuyên viên Marketing", "Mid", 13_000_000, 19_000_000,
            PhuongThucLamViec.Hybrid, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.DangTuyen, 13, 24),
        new("5809876507", "accounting", "Kế toán kho", "Mid", 11_000_000, 16_000_000,
            PhuongThucLamViec.Onsite, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.TamDung, 20, 9),
        new("5809876507", "food", "Kỹ thuật viên Sản xuất", "Junior", 9_000_000, 14_000_000,
            PhuongThucLamViec.Onsite, "Đà Lạt, Lâm Đồng", TrangThaiTinTuyenDung.HetHan, 50, -12),

        // ===== Tri Thức Việt — giáo dục (0109876508) =====
        new("0109876508", "education", "Giáo viên Tiếng Anh", "Mid", 12_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 4, 31),
        new("0109876508", "education", "Giáo viên Tiếng Anh Trung học", "Senior", 18_000_000, 26_000_000,
            PhuongThucLamViec.Onsite, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 24, 16),
        new("0109876508", "education", "Trợ giảng Tiếng Anh", "Junior", 8_000_000, 12_000_000,
            PhuongThucLamViec.Onsite, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 10, 26),
        new("0109876508", "customer-service", "Chuyên viên Tư vấn Tuyển sinh", "Mid", 10_000_000, 16_000_000,
            PhuongThucLamViec.Onsite, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 15, 22),
        new("0109876508", "hr", "Chuyên viên Nhân sự", "Mid", 12_000_000, 17_000_000,
            PhuongThucLamViec.Onsite, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 29, 13),
        new("0109876508", "marketing", "Chuyên viên Marketing", "Mid", 12_000_000, 18_000_000,
            PhuongThucLamViec.Hybrid, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.ChoAdminDuyet, 1, 39),
        new("0109876508", "education", "Giáo viên Tiếng Anh Tiểu học", "Junior", 9_000_000, 14_000_000,
            PhuongThucLamViec.Onsite, "Thanh Xuân, Hà Nội", TrangThaiTinTuyenDung.DaDong, 46, -7),

        // ===== Đông Anh Mech — cơ khí chính xác (0109876509) =====
        new("0109876509", "mechanical", "Kỹ thuật viên CNC", "Mid", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 6, 29),
        new("0109876509", "mechanical", "Kỹ sư Cơ khí (AutoCAD/SolidWorks)", "Mid", 16_000_000, 24_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 18, 19),
        new("0109876509", "qa", "Kỹ sư QC Cơ khí", "Mid", 13_000_000, 19_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 26, 15),
        new("0109876509", "logistics", "Nhân viên Kho vận", "Junior", 9_000_000, 13_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 9, 27),
        new("0109876509", "sales", "Nhân viên Kinh doanh", "Mid", 12_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.DangTuyen, 34, 12),
        new("0109876509", "mechanical", "Kỹ thuật viên CNC cao cấp", "Senior", 20_000_000, 28_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.HetHan, 52, -14),
        new("0109876509", "accounting", "Kế toán kho", "Mid", 11_000_000, 16_000_000,
            PhuongThucLamViec.Onsite, "Đông Anh, Hà Nội", TrangThaiTinTuyenDung.ChoAdminDuyet, 2, 37),

        // ===== Biển Ngọc — khách sạn và lữ hành (4409876510) =====
        new("4409876510", "hospitality", "Lễ tân Khách sạn", "Junior", 8_000_000, 12_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.DangTuyen, 3, 32),
        new("4409876510", "hospitality", "Chuyên viên Điều hành Tour", "Mid", 12_000_000, 18_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.DangTuyen, 14, 23),
        new("4409876510", "hospitality", "Giám sát Buồng phòng", "Senior", 14_000_000, 20_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.DangTuyen, 22, 17),
        new("4409876510", "sales", "Nhân viên Kinh doanh Tour", "Mid", 10_000_000, 16_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.DangTuyen, 11, 25),
        new("4409876510", "customer-service", "Chuyên viên Chăm sóc khách hàng", "Mid", 10_000_000, 15_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.DangTuyen, 30, 13),
        new("4409876510", "accounting", "Kế toán dịch vụ", "Mid", 11_000_000, 16_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.ChoAdminDuyet, 1, 39),
        new("4409876510", "hospitality", "Quản lý Khách sạn", "Senior", 22_000_000, 30_000_000,
            PhuongThucLamViec.Onsite, "Nha Trang, Khánh Hoà", TrangThaiTinTuyenDung.TamDung, 16, 12)
    ];
}
