#nullable enable
using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Từ điển kỹ năng chuẩn (DanhMucKyNang) và yêu cầu kỹ năng cho tin tuyển dụng.
    /// Hai phía so khớp của ContentBasedMatcher đều đọc từ điển này: database mới
    /// chưa có seeder nào nên KyNang trống, mọi tin không có yêu cầu kỹ năng, và
    /// gợi ý việc làm luôn trả điểm 0 (card "Adam gợi ý cho bạn" rỗng).
    /// Idempotent — chỉ bổ sung phần còn thiếu, không sửa kỹ năng đã được chỉnh
    /// bằng nghiệp vụ (tin đã có kỹ năng sẽ bị bỏ qua).
    /// </summary>
    public static class DefaultDanhMucKyNang
    {
        private static readonly DateTime SeedInstant = new(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc);
        private const string SeedAuthor = "system";

        private static readonly (string Ten, string MoTa)[] Catalog =
        [
            // Backend
            ("C#", "Ngôn ngữ lập trình chủ lực của hệ sinh thái .NET."),
            (".NET Core", "Nền tảng ứng dụng đa nền tảng của Microsoft."),
            ("ASP.NET Core", "Framework xây dựng web API và dịch vụ phía server."),
            ("Entity Framework Core", "ORM truy cập dữ liệu quan hệ cho ứng dụng .NET."),
            ("MediatR", "Dispatcher cho mô hình CQRS trong ứng dụng .NET."),
            ("Clean Architecture", "Tổ chức dự án theo lớp, phụ thuộc hướng vào miền."),
            ("REST API", "Thiết kế endpoint theo tài nguyên và chuẩn HTTP."),
            ("Microservices", "Chia hệ thống thành dịch vụ độc lập, triển khai riêng."),
            ("SignalR", "Giao tiếp realtime hai chiều qua WebSocket."),
            ("Unit Testing", "Viết và duy trì kiểm thử đơn vị cho code ứng dụng."),
            ("Java", "Ngôn ngữ lập trình hướng đối tượng chạy trên JVM."),
            ("Spring Boot", "Framework xây dựng dịch vụ Java hướng cấu hình tối giản."),
            // Frontend
            ("JavaScript", "Ngôn ngữ lập trình phía trình duyệt."),
            ("TypeScript", "JavaScript có kiểu cho dự án lớn."),
            ("React", "Thư viện xây dựng giao diện theo component."),
            ("Next.js", "Framework React cho ứng dụng web định tuyến server."),
            ("Vue.js", "Framework xây dựng giao diện một trang."),
            ("Node.js", "Runtime JavaScript phía server."),
            ("HTML", "Ngôn ngữ đánh dấu cấu trúc trang web."),
            ("CSS", "Ngôn ngữ định dạng giao diện trang web."),
            ("Tailwind CSS", "Framework utility-first cho giao diện."),
            ("Responsive Design", "Bố cục thích ứng nhiều cỡ màn hình."),
            ("Web Accessibility", "Giao diện dùng được cho cả công nghệ hỗ trợ."),
            // Dữ liệu
            ("SQL", "Truy vấn và thao tác dữ liệu quan hệ."),
            ("SQL Server", "Hệ quản trị CSDL quan hệ của Microsoft."),
            ("PostgreSQL", "Hệ quản trị CSDL quan hệ mã nguồn mở."),
            ("Python", "Ngôn ngữ cho phân tích dữ liệu và tự động hoá."),
            ("Pandas", "Thư viện xử lý dữ liệu dạng bảng trong Python."),
            ("Power BI", "Công cụ xây dựng báo cáo và dashboard."),
            ("Excel", "Bảng tính phục vụ báo cáo và phân tích vận hành."),
            ("Data Visualization", "Trình bày kết quả phân tích bằng biểu đồ."),
            ("Machine Learning", "Xây dựng mô hình học máy dự đoán và phân lớp."),
            ("Statistics", "Thống kê ứng dụng trong phân tích dữ liệu."),
            ("ETL", "Trích xuất, chuyển đổi và nạp dữ liệu giữa các nguồn."),
            // DevOps
            ("Git", "Hệ thống quản lý phiên bản phân tán."),
            ("GitHub", "Nền tảng lưu trữ và hợp tác mã nguồn."),
            ("Docker", "Đóng gói ứng dụng vào container."),
            ("Kubernetes", "Điều phối và vận hành hệ thống container."),
            ("CI/CD", "Tích hợp và triển khai liên tục."),
            ("Linux", "Hệ điều hành máy chủ dòng lệnh."),
            ("Terraform", "Cơ sở hạ tầng khai báo bằng mã."),
            ("AWS", "Nền tảng đám mây của Amazon."),
            ("Azure", "Nền tảng đám mây của Microsoft."),
            ("Monitoring", "Theo dõi sức khoẻ hệ thống và cảnh báo."),
            // Kiểm thử
            ("Manual Testing", "Thực hiện kịch bản kiểm thử thủ công."),
            ("Test Automation", "Tự động hoá hồi quy bằng script."),
            ("Selenium", "Công cụ kiểm thử giao diện trình duyệt."),
            ("Playwright", "Khung kiểm thử end-to-end đa trình duyệt."),
            ("Test Case Design", "Thiết kế kịch bản kiểm thử phủ yêu cầu."),
            ("Bug Reporting", "Ghi nhận và mô tả lỗi cho lập trình viên."),
            // Thiết kế
            ("Figma", "Công cụ thiết kế giao diện hợp tác thời gian thực."),
            ("UI Design", "Thiết kế giao diện và hệ màu, typography."),
            ("UX Research", "Nghiên cứu hành vi người dùng cho sản phẩm."),
            ("Design System", "Bộ quy ước component tái sử dụng."),
            ("Prototyping", "Dựng nguyên mẫu tương tác để kiểm thử ý tưởng."),
            // Nhân sự
            ("Recruitment", "Vận hành quy trình tuyển dụng từ đăng tin đến offer."),
            ("Interviewing", "Phỏng vấn và đánh giá ứng viên."),
            ("HR Administration", "Quản lý hồ sơ, chế độ và thủ tục nhân sự."),
            ("Employee Relations", "Quan hệ lao động và truyền thông nội bộ."),
            ("Payroll", "Tính lương và bảo hiểm cho nhân viên."),
            // Kế toán
            ("Accounting", "Hạch toán và lập báo cáo tài chính."),
            ("Tax Regulations", "Khai và tuân thủ quy định thuế."),
            ("Invoice Processing", "Xuất và đối chiếu hóa đơn, chứng từ."),
            ("Auditing", "Kiểm tra và đối soát số kế toán."),
            // Kinh doanh / tiếp thị
            ("Sales", "Tìm kiếm và chốt đơn với khách hàng doanh nghiệp."),
            ("Negotiation", "Đàm phán hợp đồng và điều khoản thương mại."),
            ("CRM", "Quản lý quan hệ khách hàng trên hệ thống."),
            ("Lead Generation", "Xây nguồn khách hàng tiềm năng."),
            ("Customer Service", "Hỗ trợ và chăm sóc khách hàng."),
            ("Marketing", "Lập kế hoạch và chạy chiến dịch tiếp thị."),
            ("Content Creation", "Sản xuất nội dung cho kênh truyền thông."),
            ("SEO", "Tối ưu nội dung cho công cụ tìm kiếm."),
            // Kỹ năng nền tảng
            ("Communication", "Trao đổi rõ ràng với đồng nghiệp và khách hàng."),
            ("Teamwork", "Làm việc nhóm cross-functional."),
            ("Problem Solving", "Phân tích và xử lý vấn đề phát sinh."),
            ("Analytical Problem-Solving", "Giải quyết vấn đề dựa trên dữ liệu."),
            ("Adaptability & Continuous Learning", "Thích nghi và chủ động học công nghệ mới."),
            ("Time Management", "Ưu tiên và bàn giao đúng hạn."),
            ("Critical Thinking", "Đánh giá thông tin trước khi quyết định."),
            ("Attention to Detail", "Kiểm tra kỹ, hạn chế sai sót nhỏ."),
            ("English", "Sử dụng tiếng Anh trong công việc chuyên môn."),
        ];

        private static readonly (string Keyword, (string Ten, MucDoYC MucDo)[] Skills)[] JobRules =
        [
            (".net",
            [
                (".NET Core", MucDoYC.BatBuc), ("C#", MucDoYC.BatBuc),
                ("ASP.NET Core", MucDoYC.BatBuc), ("Entity Framework Core", MucDoYC.UuTien),
                ("SQL Server", MucDoYC.UuTien), ("REST API", MucDoYC.UuTien),
                ("Git", MucDoYC.UuTien), ("Clean Architecture", MucDoYC.UuTien),
                ("Docker", MucDoYC.KhongBatBuoc), ("Unit Testing", MucDoYC.KhongBatBuoc),
                ("Problem Solving", MucDoYC.KhongBatBuoc),
            ]),
            ("backend",
            [
                ("REST API", MucDoYC.BatBuc), ("SQL", MucDoYC.BatBuc),
                ("PostgreSQL", MucDoYC.UuTien), ("Docker", MucDoYC.UuTien),
                ("Microservices", MucDoYC.UuTien), ("Git", MucDoYC.UuTien),
                ("Linux", MucDoYC.KhongBatBuoc), ("Problem Solving", MucDoYC.KhongBatBuoc),
            ]),
            ("frontend",
            [
                ("JavaScript", MucDoYC.BatBuc), ("TypeScript", MucDoYC.UuTien),
                ("React", MucDoYC.UuTien), ("HTML", MucDoYC.BatBuc),
                ("CSS", MucDoYC.BatBuc), ("Tailwind CSS", MucDoYC.KhongBatBuoc),
                ("Responsive Design", MucDoYC.UuTien), ("Git", MucDoYC.UuTien),
                ("Web Accessibility", MucDoYC.KhongBatBuoc),
            ]),
            ("full-stack",
            [
                ("JavaScript", MucDoYC.BatBuc), ("Node.js", MucDoYC.UuTien),
                ("React", MucDoYC.UuTien), ("SQL", MucDoYC.BatBuc),
                ("REST API", MucDoYC.BatBuc), ("Docker", MucDoYC.KhongBatBuoc),
                ("Git", MucDoYC.UuTien), ("HTML", MucDoYC.UuTien),
            ]),
            ("data analyst",
            [
                ("SQL", MucDoYC.BatBuc), ("Excel", MucDoYC.BatBuc),
                ("Power BI", MucDoYC.UuTien), ("Python", MucDoYC.UuTien),
                ("Data Visualization", MucDoYC.UuTien), ("Statistics", MucDoYC.KhongBatBuoc),
                ("Analytical Problem-Solving", MucDoYC.UuTien), ("Communication", MucDoYC.KhongBatBuoc),
            ]),
            ("data scientist",
            [
                ("Python", MucDoYC.BatBuc), ("Machine Learning", MucDoYC.BatBuc),
                ("SQL", MucDoYC.UuTien), ("Statistics", MucDoYC.UuTien),
                ("Pandas", MucDoYC.UuTien), ("Data Visualization", MucDoYC.KhongBatBuoc),
            ]),
            ("devops",
            [
                ("Linux", MucDoYC.BatBuc), ("Docker", MucDoYC.BatBuc),
                ("Kubernetes", MucDoYC.UuTien), ("CI/CD", MucDoYC.BatBuc),
                ("Terraform", MucDoYC.UuTien), ("AWS", MucDoYC.UuTien),
                ("Monitoring", MucDoYC.KhongBatBuoc), ("Git", MucDoYC.UuTien),
            ]),
            ("qa engineer",
            [
                ("Test Case Design", MucDoYC.BatBuc), ("Manual Testing", MucDoYC.BatBuc),
                ("Bug Reporting", MucDoYC.UuTien), ("SQL", MucDoYC.UuTien),
                ("Test Automation", MucDoYC.KhongBatBuoc), ("Playwright", MucDoYC.KhongBatBuoc),
                ("Attention to Detail", MucDoYC.UuTien),
            ]),
            ("ui/ux",
            [
                ("Figma", MucDoYC.BatBuc), ("UI Design", MucDoYC.BatBuc),
                ("UX Research", MucDoYC.UuTien), ("Design System", MucDoYC.UuTien),
                ("Prototyping", MucDoYC.UuTien), ("Communication", MucDoYC.KhongBatBuoc),
            ]),
            ("hr specialist",
            [
                ("Recruitment", MucDoYC.BatBuc), ("Interviewing", MucDoYC.BatBuc),
                ("HR Administration", MucDoYC.UuTien), ("Communication", MucDoYC.UuTien),
                ("Employee Relations", MucDoYC.KhongBatBuoc), ("Excel", MucDoYC.KhongBatBuoc),
            ]),
            ("sales executive",
            [
                ("Sales", MucDoYC.BatBuc), ("Negotiation", MucDoYC.UuTien),
                ("CRM", MucDoYC.UuTien), ("Lead Generation", MucDoYC.KhongBatBuoc),
                ("Customer Service", MucDoYC.UuTien), ("Communication", MucDoYC.KhongBatBuoc),
            ]),
            ("accountant",
            [
                ("Accounting", MucDoYC.BatBuc), ("Tax Regulations", MucDoYC.BatBuc),
                ("Invoice Processing", MucDoYC.UuTien), ("Excel", MucDoYC.BatBuc),
                ("Auditing", MucDoYC.KhongBatBuoc), ("Attention to Detail", MucDoYC.UuTien),
            ]),
            ("marketing",
            [
                ("Marketing", MucDoYC.BatBuc), ("Content Creation", MucDoYC.UuTien),
                ("SEO", MucDoYC.KhongBatBuoc), ("Communication", MucDoYC.UuTien),
                ("Excel", MucDoYC.KhongBatBuoc),
            ]),
        ];

        /// <summary>Bỏ dấu tiếng Việt và chữ thường để so khớp từ khoá trong tiêu đề.</summary>
        private static string TitleKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            var decomposed = value.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();
            foreach (var ch in decomposed)
            {
                if (char.GetUnicodeCategory(ch) == System.Globalization.UnicodeCategory.NonSpacingMark) continue;
                builder.Append(char.ToLowerInvariant(ch));
            }
            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        public static async Task SeedAsync(IApplicationDbContext appContext, IDistributedCache cache)
        {
            var existingNames = appContext.KyNangs.Select(x => x.TenKyNang).ToHashSet(StringComparer.Ordinal);
            var added = 0;
            foreach (var (ten, moTa) in Catalog)
            {
                if (existingNames.Contains(ten)) continue;
                existingNames.Add(ten);
                await appContext.KyNangs.AddAsync(new DanhMucKyNang
                {
                    TenKyNang = ten,
                    MoTa = moTa,
                    Created = SeedInstant,
                    CreatedBy = SeedAuthor,
                });
                added++;
            }
            if (added > 0) await appContext.SaveChangesAsync();

            var skillIds = appContext.KyNangs
                .ToList()
                .GroupBy(x => x.TenKyNang, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.Ordinal);

            // Tin đã có kỹ năng là dữ liệu nghiệp vụ (nhà tuyển dụng tự chọn) — không đụng tới.
            var linked = appContext.KyNangTinTuyenDungs.Select(x => x.TinTuyenDungId).ToHashSet();
            var targets = appContext.TinTuyenDungs
                .ToList()
                .Where(t => !linked.Contains(t.Id))
                .ToList();

            var attached = 0;
            foreach (var tin in targets)
            {
                var key = TitleKey(tin.TieuDe);
                if (key.Length == 0) continue;
                var wanted = JobRules
                    .Where(rule => key.Contains(rule.Keyword))
                    .SelectMany(rule => rule.Skills)
                    .GroupBy(x => x.Ten, StringComparer.Ordinal)
                    .Select(g => g.OrderByDescending(x => x.MucDo).First())
                    .ToList();
                foreach (var (ten, mucDo) in wanted)
                {
                    if (!skillIds.TryGetValue(ten, out var kyNangId)) continue;
                    await appContext.KyNangTinTuyenDungs.AddAsync(new KyNangTinTuyenDung
                    {
                        TinTuyenDungId = tin.Id,
                        KyNangId = kyNangId,
                        MucDoYeuCau = mucDo,
                        Created = SeedInstant,
                        CreatedBy = SeedAuthor,
                    });
                    attached++;
                }
            }
            if (attached > 0) await appContext.SaveChangesAsync();

            if (added > 0 || attached > 0)
            {
                // Kết quả gợi ý đang cache theo phiên bản pool tin; đẩy version để
                // lần mở dashboard kế tiếp chấm điểm lại trên dữ liệu mới.
                await RecommendationCache.InvalidateJobsAsync(cache, default);
                await RecommendationCache.InvalidateCandidatePoolAsync(cache, default);
            }
        }
    }
}
