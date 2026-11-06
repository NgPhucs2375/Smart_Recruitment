#nullable enable
using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Bộ dữ liệu mẫu để luồng gợi ý (content-based matching) chạy được end-to-end:
    /// kỹ năng cho CV của các tài khoản demo và tin đang tuyển khớp với những CV đó.
    /// Trước đây cả hai phía của phép so khớp đều trống — CV demo không có kỹ năng nên
    /// chiều "gợi ý ứng viên cho tin" trả điểm 0, còn pool tin đang tuyển không phủ
    /// tổ hợp kỹ năng của CV thật nên chiều "gợi ý việc làm" luôn dưới ngưỡng hiển thị.
    /// Idempotent — chỉ bổ sung CV chưa có kỹ năng nào và tin chưa tồn tại theo tiêu đề.
    /// </summary>
    public static class DefaultGoiYDemoData
    {
        private const string EmployerEmail = "employer@gmail.com";
        private const string DemoEmailSuffix = "@seed.local";
        private const string SeedAuthor = "system";

        private static readonly DateTime SeedInstant = new(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc);
        private static readonly DateTime DemoExpiry = new(2027, 1, 31, 0, 0, 0, DateTimeKind.Utc);

        /// <summary>Vị trí của ứng viên demo → kỹ năng CV, lấy đúng tên từ điển của DefaultDanhMucKyNang.</summary>
        private static readonly (string ViTri, (string Ten, MucDo ThanhThao)[] KyNang)[] CvSkillByPosition =
        [
            ("Frontend Developer",
            [
                ("JavaScript", MucDo.ThanhThao), ("HTML", MucDo.ThanhThao), ("CSS", MucDo.ThanhThao),
                ("React", MucDo.TrungBinh), ("TypeScript", MucDo.TrungBinh), ("Git", MucDo.TrungBinh),
                ("Responsive Design", MucDo.TrungBinh), ("Communication", MucDo.ThanhThao),
            ]),
            ("Backend Developer (.NET)",
            [
                ("C#", MucDo.ChuyenGia), (".NET Core", MucDo.ThanhThao), ("ASP.NET Core", MucDo.ThanhThao),
                ("Entity Framework Core", MucDo.TrungBinh), ("SQL Server", MucDo.TrungBinh),
                ("REST API", MucDo.TrungBinh), ("Git", MucDo.TrungBinh), ("Docker", MucDo.CoBan),
            ]),
            ("Kế toán tổng hợp",
            [
                ("Accounting", MucDo.ThanhThao), ("Tax Regulations", MucDo.ThanhThao),
                ("Excel", MucDo.ThanhThao), ("Invoice Processing", MucDo.TrungBinh),
                ("Auditing", MucDo.TrungBinh), ("Attention to Detail", MucDo.ThanhThao),
            ]),
            ("Nhân viên Marketing",
            [
                ("Marketing", MucDo.ThanhThao), ("Content Creation", MucDo.TrungBinh),
                ("Communication", MucDo.ThanhThao), ("SEO", MucDo.CoBan), ("Excel", MucDo.TrungBinh),
            ]),
            ("Chuyên viên tuyển dụng",
            [
                ("Recruitment", MucDo.ThanhThao), ("Interviewing", MucDo.ThanhThao),
                ("HR Administration", MucDo.TrungBinh), ("Communication", MucDo.ThanhThao),
                ("Employee Relations", MucDo.CoBan), ("Excel", MucDo.TrungBinh),
            ]),
            ("Nhân viên kinh doanh",
            [
                ("Sales", MucDo.ThanhThao), ("Negotiation", MucDo.TrungBinh), ("CRM", MucDo.TrungBinh),
                ("Customer Service", MucDo.TrungBinh), ("Communication", MucDo.ThanhThao),
            ]),
            ("UI/UX Designer",
            [
                ("Figma", MucDo.ThanhThao), ("UI Design", MucDo.ThanhThao),
                ("UX Research", MucDo.TrungBinh), ("Design System", MucDo.TrungBinh),
                ("Prototyping", MucDo.TrungBinh), ("Communication", MucDo.ThanhThao),
            ]),
            ("Data Analyst",
            [
                ("SQL", MucDo.ThanhThao), ("Excel", MucDo.ThanhThao), ("Power BI", MucDo.TrungBinh),
                ("Python", MucDo.TrungBinh), ("Data Visualization", MucDo.TrungBinh),
                ("Analytical Problem-Solving", MucDo.TrungBinh), ("Communication", MucDo.ThanhThao),
            ]),
            ("Tester/QC",
            [
                ("Manual Testing", MucDo.ThanhThao), ("Test Case Design", MucDo.ThanhThao),
                ("Bug Reporting", MucDo.TrungBinh), ("SQL", MucDo.TrungBinh),
                ("Attention to Detail", MucDo.ThanhThao), ("Test Automation", MucDo.CoBan),
            ]),
            ("Nhân viên kho",
            [
                ("Excel", MucDo.TrungBinh), ("Time Management", MucDo.TrungBinh),
                ("Attention to Detail", MucDo.TrungBinh), ("Teamwork", MucDo.ThanhThao),
                ("Communication", MucDo.TrungBinh),
            ]),
        ];

        private sealed record Requirement(string Ten, MucDoYC MucDo);

        private sealed record DemoJob(
            string TieuDe,
            string DanhMuc,
            string DiaDiem,
            decimal LuongToiThieu,
            decimal LuongToiDa,
            PhuongThucLamViec LamViec,
            string KinhNghiem,
            string MoTa,
            string QuyenLoi,
            Requirement[] KyNang);

        /// <summary>
        /// Mỗi tin được viết để ít nhất một CV demo khớp gần toàn bộ yêu cầu (chiều gợi ý
        /// ứng viên); ba tin IT đầu khớp tổ hợp kỹ năng của một CV .NET thực tế (chiều gợi ý
        /// việc làm). Địa điểm ghi cấp tỉnh/thành để so được với địa chỉ CV dài hơn.
        /// </summary>
        private static readonly DemoJob[] Jobs =
        [
            new("Software Engineer Intern (Backend .NET)", "Backend Development", "TP. Hồ Chí Minh",
                8_000_000m, 14_000_000m, PhuongThucLamViec.Hybrid, "0 - 1 năm (chấp nhận sinh viên năm cuối)",
                "Tham gia phát triển dịch vụ backend .NET cùng đội ngũ hiện hữu: viết API, sửa lỗi, viết test và học quy trình làm việc nhóm.",
                "Trợ cấp thực tập, kèm cặp 1-1, có lộ trình lên chính thức sau 6 tháng.",
                [
                    new(".NET Core", MucDoYC.BatBuc), new("Git", MucDoYC.UuTien),
                    new("REST API", MucDoYC.UuTien), new("SQL", MucDoYC.UuTien),
                    new("Docker", MucDoYC.UuTien),
                    new("Adaptability & Continuous Learning", MucDoYC.UuTien),
                    new("GitHub", MucDoYC.KhongBatBuoc), new("Unit Testing", MucDoYC.KhongBatBuoc),
                    new("Problem Solving", MucDoYC.KhongBatBuoc),
                    new("Analytical Problem-Solving", MucDoYC.KhongBatBuoc),
                ]),
            new("Backend Developer (.NET)", "Backend Development", "TP. Hồ Chí Minh",
                20_000_000m, 35_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 2 năm với .NET",
                "Xây dựng và bảo trì REST API theo kiến trúc phân lớp, làm việc trực tiếp với product owner và đội frontend.",
                "Lương tháng 13, bảo hiểm sức khỏe, review lương 6 tháng/lần.",
                [
                    new("C#", MucDoYC.BatBuc), new(".NET Core", MucDoYC.BatBuc),
                    new("ASP.NET Core", MucDoYC.BatBuc),
                    new("Entity Framework Core", MucDoYC.UuTien),
                    new("SQL Server", MucDoYC.UuTien), new("REST API", MucDoYC.UuTien),
                    new("Git", MucDoYC.UuTien), new("Clean Architecture", MucDoYC.UuTien),
                    new("Docker", MucDoYC.KhongBatBuoc), new("Unit Testing", MucDoYC.KhongBatBuoc),
                    new("Problem Solving", MucDoYC.KhongBatBuoc),
                ]),
            new("Backend Developer (Java Spring Boot)", "Backend Development", "TP. Hồ Chí Minh",
                18_000_000m, 30_000_000m, PhuongThucLamViec.Hybrid, "Tối thiểu 1 năm với Spring Boot",
                "Phát triển dịch vụ Java Spring Boot, tham gia thiết kế schema và tối ưu truy vấn cho các luồng nghiệp vụ mới.",
                "Làm việc hybrid 2 ngày/tuần, phụ cấp thiết bị, ngân sách học chứng chỉ.",
                [
                    new("Java", MucDoYC.BatBuc), new("Spring Boot", MucDoYC.BatBuc),
                    new("REST API", MucDoYC.UuTien), new("SQL", MucDoYC.UuTien),
                    new("Docker", MucDoYC.UuTien), new("Git", MucDoYC.UuTien),
                    new("PostgreSQL", MucDoYC.KhongBatBuoc),
                    new("Microservices", MucDoYC.KhongBatBuoc),
                    new("Problem Solving", MucDoYC.KhongBatBuoc),
                ]),
            new("Frontend Developer (React & TypeScript)", "Frontend Development", "TP. Hồ Chí Minh",
                15_000_000m, 28_000_000m, PhuongThucLamViec.Hybrid, "Tối thiểu 1 năm với React",
                "Dựng giao diện từ thiết kế có sẵn, bảo đảm responsive và khả năng truy cập, phối hợp với backend để hoàn thiện luồng người dùng.",
                "Review lương hàng năm, team building quý, trang thiết bị tự chọn.",
                [
                    new("JavaScript", MucDoYC.BatBuc), new("HTML", MucDoYC.BatBuc),
                    new("CSS", MucDoYC.BatBuc), new("React", MucDoYC.UuTien),
                    new("TypeScript", MucDoYC.UuTien),
                    new("Responsive Design", MucDoYC.UuTien), new("Git", MucDoYC.UuTien),
                    new("Tailwind CSS", MucDoYC.KhongBatBuoc),
                    new("Web Accessibility", MucDoYC.KhongBatBuoc),
                ]),
            new("Data Analyst (Báo cáo & Dashboard)", "Data Science & Analytics", "Cần Thơ",
                18_000_000m, 28_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 2 năm phân tích dữ liệu",
                "Thu thập và làm sạch dữ liệu vận hành, xây dashboard theo dõi chỉ số và trình bày kết quả cho khối kinh doanh.",
                "Lương cạnh tranh khu vực Cần Thơ, phụ cấp ăn trưa, hỗ trợ chỗ ở cho ứng viên chuyển đến.",
                [
                    new("SQL", MucDoYC.BatBuc), new("Excel", MucDoYC.BatBuc),
                    new("Power BI", MucDoYC.UuTien), new("Python", MucDoYC.UuTien),
                    new("Data Visualization", MucDoYC.UuTien),
                    new("Analytical Problem-Solving", MucDoYC.UuTien),
                    new("Statistics", MucDoYC.KhongBatBuoc),
                    new("Communication", MucDoYC.KhongBatBuoc),
                ]),
            new("QA Engineer (Manual & Automation)", "Kiểm thử / QA", "Hà Nội",
                12_000_000m, 20_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 1 năm kiểm thử",
                "Thiết kế kịch bản kiểm thử cho từng sprint, chạy hồi quy thủ công và dần tự động hoá các luồng chính.",
                "Bảo hiểm đầy đủ, khám sức khoẻ định kỳ, lộ trình lên Test Lead.",
                [
                    new("Test Case Design", MucDoYC.BatBuc), new("Manual Testing", MucDoYC.BatBuc),
                    new("Bug Reporting", MucDoYC.UuTien), new("SQL", MucDoYC.UuTien),
                    new("Attention to Detail", MucDoYC.UuTien),
                    new("Test Automation", MucDoYC.KhongBatBuoc),
                    new("Playwright", MucDoYC.KhongBatBuoc),
                ]),
            new("UI/UX Designer", "Thiết kế / Đồ họa", "Hà Nội",
                15_000_000m, 25_000_000m, PhuongThucLamViec.Hybrid, "Tối thiểu 2 năm thiết kế sản phẩm",
                "Phỏng vấn người dùng, dựng nguyên mẫu và bàn giao design system cho đội phát triển frontend.",
                "Cung cấp máy cấu hình cao, ngân sách khoá học thiết kế hằng năm.",
                [
                    new("Figma", MucDoYC.BatBuc), new("UI Design", MucDoYC.BatBuc),
                    new("UX Research", MucDoYC.UuTien),
                    new("Design System", MucDoYC.UuTien), new("Prototyping", MucDoYC.UuTien),
                    new("Communication", MucDoYC.KhongBatBuoc),
                ]),
            new("Nhân viên Marketing Digital", "Marketing / Truyền thông", "Hà Nội",
                10_000_000m, 16_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 1 năm marketing",
                "Lên lịch nội dung cho các kênh, viết bài và theo dõi hiệu quả chiến dịch bằng số liệu.",
                "Thưởng theo hiệu quả chiến dịch, môi trường trẻ, du lịch hằng năm.",
                [
                    new("Marketing", MucDoYC.BatBuc),
                    new("Content Creation", MucDoYC.UuTien),
                    new("Communication", MucDoYC.UuTien), new("SEO", MucDoYC.KhongBatBuoc),
                    new("Excel", MucDoYC.KhongBatBuoc),
                ]),
            new("Chuyên viên Tuyển dụng IT", "Nhân sự", "TP. Hồ Chí Minh",
                11_000_000m, 17_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 1 năm tuyển dụng",
                "Tìm kiếm và sàng lọc hồ sơ kỹ sư, sắp xếp lịch phỏng vấn và chăm sóc ứng viên đến khi ký offer.",
                "Lương cứng cộng thưởng theo vị trí tuyển thành công, được đào tạo kỹ thuật phỏng vấn.",
                [
                    new("Recruitment", MucDoYC.BatBuc), new("Interviewing", MucDoYC.BatBuc),
                    new("HR Administration", MucDoYC.UuTien),
                    new("Communication", MucDoYC.UuTien),
                    new("Employee Relations", MucDoYC.KhongBatBuoc),
                    new("Excel", MucDoYC.KhongBatBuoc),
                ]),
            new("Nhân viên Kinh doanh B2B", "Bán hàng / Kinh doanh", "TP. Hồ Chí Minh",
                12_000_000m, 22_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 1 năm bán hàng doanh nghiệp",
                "Chủ động tìm khách hàng doanh nghiệp, demo sản phẩm và chốt hợp đồng theo chỉ tiêu quý.",
                "Lương cứng cộng hoa hồng không trần, xe công tác cho các chuyến ngoại tỉnh.",
                [
                    new("Sales", MucDoYC.BatBuc), new("Negotiation", MucDoYC.UuTien),
                    new("CRM", MucDoYC.UuTien),
                    new("Customer Service", MucDoYC.UuTien),
                    new("Lead Generation", MucDoYC.KhongBatBuoc),
                    new("Communication", MucDoYC.KhongBatBuoc),
                ]),
            new("Kế toán tổng hợp", "Tài chính / Kế toán", "Đà Nẵng",
                12_000_000m, 18_000_000m, PhuongThucLamViec.Onsite, "Tối thiểu 3 năm kế toán",
                "Hạch toán, đối chiếu công nợ, lập báo cáo thuế hàng quý và làm việc trực tiếp với kiểm toán.",
                "Ổn định lâu dài, thưởng Tết từ 2 tháng lương, bảo hiểm theo mức lương thực nhận.",
                [
                    new("Accounting", MucDoYC.BatBuc),
                    new("Tax Regulations", MucDoYC.BatBuc), new("Excel", MucDoYC.BatBuc),
                    new("Invoice Processing", MucDoYC.UuTien),
                    new("Attention to Detail", MucDoYC.UuTien),
                    new("Auditing", MucDoYC.KhongBatBuoc),
                ]),
            new("Nhân viên Kho & Vận hành", "Kho vận / Logistics", "Đồng Nai",
                8_000_000m, 13_000_000m, PhuongThucLamViec.Onsite, "Không yêu cầu kinh nghiệm",
                "Nhập xuất hàng theo lệnh, kiểm kê định kỳ và cập nhật số liệu tồn kho lên bảng tính nội bộ.",
                "Phụ cấp ca đêm, cơm ca, tăng ca tính lương theo quy định.",
                [
                    new("Excel", MucDoYC.UuTien),
                    new("Time Management", MucDoYC.UuTien),
                    new("Attention to Detail", MucDoYC.UuTien),
                    new("Teamwork", MucDoYC.UuTien),
                    new("Communication", MucDoYC.KhongBatBuoc),
                ]),
        ];

        public static async Task SeedAsync(
            UserManager<ApplicationUser> userManager,
            IApplicationDbContext appContext,
            IDistributedCache cache)
        {
            var wroteCvSkills = await SeedCvSkillsAsync(userManager, appContext);
            var wroteJobs = await SeedJobsAsync(userManager, appContext);

            if (wroteCvSkills || wroteJobs)
            {
                // Kết quả gợi ý cache theo version của pool tin và pool ứng viên.
                await RecommendationCache.InvalidateJobsAsync(cache, default);
                await RecommendationCache.InvalidateCandidatePoolAsync(cache, default);
            }
        }

        /// <summary>
        /// CV của tài khoản demo (@seed.local) chưa có kỹ năng nào, nên chiều "gợi ý ứng
        /// viên cho tin" luôn trả điểm 0. Chỉ bổ sung khi CV hoàn toàn trống để không ghi
        /// đè dữ liệu ứng viên tự điền và không đụng tới CV của tài khoản thật.
        /// </summary>
        private static async Task<bool> SeedCvSkillsAsync(
            UserManager<ApplicationUser> userManager,
            IApplicationDbContext appContext)
        {
            var demoHoSoIds = await DemoHoSoUngVienIdsAsync(userManager, appContext);
            if (demoHoSoIds.Count == 0) return false;

            var skillIds = appContext.KyNangs
                .ToList()
                .GroupBy(x => x.TenKyNang, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.Ordinal);

            // AsTracking bắt buộc: ApplicationDbContext đặt mặc định NoTracking nên
            // thêm vào cv.KyNangs sẽ không được ChangeTracker phát hiện và mất im lặng.
            var cvs = appContext.CVUngViens
                .AsTracking()
                .Include(x => x.KyNangs)
                .Where(x => x.IsDefault && !x.IsDaXoa && demoHoSoIds.Contains(x.HoSoUngVienId))
                .ToList();

            var wrote = false;
            foreach (var cv in cvs)
            {
                var position = appContext.HoSoUngViens
                    .Where(x => x.Id == cv.HoSoUngVienId)
                    .Select(x => x.ViTriUngTuyen)
                    .FirstOrDefault();
                var rule = CvSkillByPosition.FirstOrDefault(
                    x => string.Equals(x.ViTri, position, StringComparison.Ordinal));
                if (cv.KyNangs.Count > 0 || rule.KyNang is null) continue;

                var order = 1;
                foreach (var (ten, thanhThao) in rule.KyNang)
                {
                    if (!skillIds.TryGetValue(ten, out var kyNangId)) continue;
                    cv.KyNangs.Add(new CVKyNang
                    {
                        CVUngVienId = cv.Id,
                        KyNangId = kyNangId,
                        TenKyNang = ten,
                        MucDoThanhThao = thanhThao,
                        ThuTu = order++,
                        Created = SeedInstant,
                        CreatedBy = SeedAuthor,
                    });
                    wrote = true;
                }
            }
            if (wrote) await appContext.SaveChangesAsync();
            return wrote;
        }

        private static async Task<HashSet<int>> DemoHoSoUngVienIdsAsync(
            UserManager<ApplicationUser> userManager,
            IApplicationDbContext appContext)
        {
            var demoUserIds = userManager.Users
                .Where(x => x.Email != null && x.Email.EndsWith(DemoEmailSuffix))
                .Select(x => x.Id)
                .ToList();
            if (demoUserIds.Count == 0) return new HashSet<int>();

            var demoAccountIds = appContext.NguoiDungs
                .Where(x => demoUserIds.Contains(x.ApplicationUserId))
                .Select(x => x.Id)
                .ToList();
            if (demoAccountIds.Count == 0) return new HashSet<int>();

            return (await appContext.HoSoUngViens
                .Where(x => demoAccountIds.Contains(x.NguoiDungId))
                .Select(x => x.Id)
                .ToListAsync())
                .ToHashSet();
        }

        private static async Task<bool> SeedJobsAsync(
            UserManager<ApplicationUser> userManager,
            IApplicationDbContext appContext)
        {
            var employerUser = await userManager.FindByEmailAsync(EmployerEmail);
            if (employerUser == null) return false;

            var employerAccount = appContext.NguoiDungs
                .FirstOrDefault(x => x.ApplicationUserId == employerUser.Id);
            if (employerAccount == null) return false;

            var doanhNghiep = appContext.DoanhNghieps
                .FirstOrDefault(x => x.NguoiDaiDienId == employerAccount.Id);
            if (doanhNghiep == null) return false;

            var danhMuc = await EnsureCategoriesAsync(appContext);
            var skillIds = appContext.KyNangs
                .ToList()
                .GroupBy(x => x.TenKyNang, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.Ordinal);
            var existingTitles = appContext.TinTuyenDungs
                .Where(x => x.DoanhNghiepId == doanhNghiep.Id)
                .Select(x => x.TieuDe)
                .ToList()
                .ToHashSet(StringComparer.Ordinal);

            var wrote = false;
            foreach (var job in Jobs)
            {
                if (existingTitles.Contains(job.TieuDe)) continue;
                if (!danhMuc.TryGetValue(job.DanhMuc, out var danhMucNgheId)) continue;

                var tin = new TinTuyenDung
                {
                    DoanhNghiepId = doanhNghiep.Id,
                    DanhMucNgheId = danhMucNgheId,
                    NguoiDangTinId = employerAccount.Id,
                    TieuDe = job.TieuDe,
                    MoTaCongViec = job.MoTa,
                    KinhNghiemYeuCau = job.KinhNghiem,
                    YeuCauCongViec = string.Join(", ", job.KyNang.Select(x => x.Ten)),
                    QuyenLoi = job.QuyenLoi,
                    DiaDiemLamViec = job.DiaDiem,
                    PhuongThucLamViec = job.LamViec,
                    LuongToiThieu = job.LuongToiThieu,
                    LuongToiDa = job.LuongToiDa,
                    TrangThai = TrangThaiTinTuyenDung.DangTuyen,
                    NgayHetHan = DemoExpiry,
                    Created = SeedInstant,
                    CreatedBy = SeedAuthor,
                };
                await appContext.TinTuyenDungs.AddAsync(tin);
                await appContext.SaveChangesAsync();

                foreach (var (ten, mucDo) in job.KyNang)
                {
                    if (!skillIds.TryGetValue(ten, out var kyNangId)) continue;
                    appContext.KyNangTinTuyenDungs.Add(new KyNangTinTuyenDung
                    {
                        TinTuyenDungId = tin.Id,
                        KyNangId = kyNangId,
                        MucDoYeuCau = mucDo,
                        Created = SeedInstant,
                        CreatedBy = SeedAuthor,
                    });
                }
                await appContext.SaveChangesAsync();
                wrote = true;
            }
            return wrote;
        }

        private static async Task<Dictionary<string, int>> EnsureCategoriesAsync(IApplicationDbContext appContext)
        {
            var wanted = Jobs.Select(x => x.DanhMuc).Distinct(StringComparer.Ordinal).ToArray();
            var existing = await appContext.DanhMucNghes.ToListAsync();
            foreach (var ten in wanted.Where(ten => !existing.Any(x => x.TenNghe == ten)))
            {
                await appContext.DanhMucNghes.AddAsync(new DanhMucNghe
                {
                    TenNghe = ten,
                    MoTa = $"Danh mục mẫu cho bộ tin demo gợi ý ({ten}).",
                    IsActive = true,
                    Created = SeedInstant,
                    CreatedBy = SeedAuthor,
                });
            }
            await appContext.SaveChangesAsync();

            return (await appContext.DanhMucNghes.ToListAsync())
                .Where(x => wanted.Contains(x.TenNghe, StringComparer.Ordinal))
                .GroupBy(x => x.TenNghe, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.Ordinal);
        }
    }
}
