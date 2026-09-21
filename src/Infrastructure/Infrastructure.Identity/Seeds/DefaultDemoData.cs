using Microsoft.AspNetCore.Identity;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Bơm dữ liệu demo tối thiểu cho tài khoản người đại diện được seed
    /// (employer@gmail.com): danh mục nghề, doanh nghiệp, hồ sơ nhà tuyển dụng
    /// và 2 tin đang tuyển — để các luồng tuyển dụng (mời nhân sự, đăng tin,
    /// dashboard tổng quan) có dữ liệu hoạt động ngay lần chạy đầu.
    /// Idempotent — chỉ tạo khi chưa tồn tại trong DB.
    /// </summary>
    public static class DefaultDemoData
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            // 1. Danh mục nghề chuẩn — check theo TenNghe để không seed trùng
            var danhMucs = new[]
            {
                ("Công nghệ thông tin", "Phát triển phần mềm, hạ tầng, dữ liệu và an ninh mạng."),
                ("Kế toán / Kiểm toán", "Kế toán, kiểm toán, thuế và báo cáo tài chính."),
                ("Marketing / Truyền thông", "Digital marketing, content, SEO và quảng cáo."),
                ("Bán hàng / Kinh doanh", "Kinh doanh B2B/B2C và chăm sóc khách hàng."),
                ("Nhân sự", "Tuyển dụng, đào tạo, C&B và vận hành nhân sự."),
                ("Kỹ thuật / Sản xuất", "Cơ khí, tự động hóa và vận hành nhà máy."),
                ("Thiết kế / Đồ họa", "UI/UX, thiết kế đồ họa và motion."),
                ("Logistics / Chuỗi cung ứng", "Vận tải, kho bãi và supply chain."),
                ("Tài chính / Ngân hàng", "Tài chính doanh nghiệp, ngân hàng và đầu tư."),
                ("Y tế / Chăm sóc sức khỏe", "Bác sĩ, điều dưỡng và dược phẩm.")
            };
            var danhMucMap = new Dictionary<string, int>();
            foreach (var (tenNghe, moTa) in danhMucs)
            {
                var existing = appContext.DanhMucNghes.FirstOrDefault(d => d.TenNghe == tenNghe);
                if (existing == null)
                {
                    var entity = new DanhMucNghe { TenNghe = tenNghe, MoTa = moTa, IsActive = true };
                    await appContext.DanhMucNghes.AddAsync(entity);
                    await appContext.SaveChangesAsync();
                    danhMucMap[tenNghe] = entity.Id;
                }
                else
                {
                    danhMucMap[tenNghe] = existing.Id;
                }
            }

            // 2. Doanh nghiệp + hồ sơ nhà tuyển dụng + tin đang tuyển
            //    cho tài khoản người đại diện được seed.
            var employerApp = await userManager.FindByEmailAsync("employer@gmail.com");
            if (employerApp == null)
            {
                return; // Chưa có tài khoản người đại diện (DefaultNguoiDaiDien chưa chạy/thất bại) — bỏ qua
            }

            var employerNd = appContext.NguoiDungs.FirstOrDefault(n => n.ApplicationUserId == employerApp.Id);
            if (employerNd == null)
            {
                return;
            }

            var doanhNghiep = appContext.DoanhNghieps.FirstOrDefault(d => d.NguoiDaiDienId == employerNd.Id);
            if (doanhNghiep == null)
            {
                doanhNghiep = new DoanhNghiep
                {
                    TenDoanhNghiep = "Công ty TNHH Công nghệ Smart Recruitment",
                    MoTa = "Doanh nghiệp demo gắn với tài khoản người đại diện (employer@gmail.com) dùng để kiểm thử các luồng tuyển dụng.",
                    Website = "https://smart-recruitment.example.com",
                    DiaChi = "Khu công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh",
                    MaSoThue = "0312345678",
                    LinhVucHoatDong = "Công nghệ thông tin",
                    QuyMoNhanSu = "50-100 nhân viên",
                    NguoiDaiDienId = employerNd.Id
                };
                await appContext.DoanhNghieps.AddAsync(doanhNghiep);
                await appContext.SaveChangesAsync();
            }

            if (!appContext.HoSoNhaTuyenDungs.Any(h => h.NguoiDungId == employerNd.Id))
            {
                await appContext.HoSoNhaTuyenDungs.AddAsync(new HoSoNhaTuyenDung
                {
                    NguoiDungId = employerNd.Id,
                    DoanhNghiepId = doanhNghiep.Id,
                    HoTen = "Trần Nam",
                    SDT = "0901234567",
                    ChucVu = "Giám đốc nhân sự"
                });
                await appContext.SaveChangesAsync();
            }

            // 3. Hai tin đang tuyển cho doanh nghiệp demo — check theo (DoanhNghiepId, TieuDe)
            var tins = new[]
            {
                new
                {
                    TieuDe = "Senior .NET Developer",
                    DanhMuc = "Công nghệ thông tin",
                    DiaDiem = "TP. Hồ Chí Minh",
                    LuongToiThieu = 25000000m,
                    LuongToiDa = 45000000m,
                    MoTa = "Phát triển và bảo trì các service .NET của nền tảng tuyển dụng, làm việc với đội ngũ backend hiện có.",
                    KinhNghiem = "Tối thiểu 3 năm kinh nghiệm phát triển .NET/.NET Core; có kinh nghiệm EF Core, SQL Server/PostgreSQL.",
                    YeuCau = "Tư duy tốt, chủ động trong công việc; biết đọc hiểu tiếng Anh kỹ thuật; ưu tiên có kinh nghiệm MediatR, Clean Architecture.",
                    QuyenLoi = "Lương tháng 13, bảo hiểm sức khỏe cao cấp, làm việc hybrid 2 ngày/tuần tại nhà."
                },
                new
                {
                    TieuDe = "Chuyên viên Marketing Digital",
                    DanhMuc = "Marketing / Truyền thông",
                    DiaDiem = "TP. Hồ Chí Minh",
                    LuongToiThieu = 12000000m,
                    LuongToiDa = 20000000m,
                    MoTa = "Xây dựng và vận hành các kênh marketing digital của nền tảng: content, SEO, quảng cáo và mạng xã hội.",
                    KinhNghiem = "Tối thiểu 2 năm kinh nghiệm digital marketing; từng chạy chiến dịch quảng cáo thực tế.",
                    YeuCau = "Hiểu SEO/SEM và các công cụ analytics; khả năng viết content tiếng Việt tốt.",
                    QuyenLoi = "Review lương 6 tháng/lần, phụ cấp điện thoại, team building quý."
                }
            };
            foreach (var t in tins)
            {
                if (appContext.TinTuyenDungs.Any(x => x.DoanhNghiepId == doanhNghiep.Id && x.TieuDe == t.TieuDe))
                {
                    continue;
                }
                await appContext.TinTuyenDungs.AddAsync(new TinTuyenDung
                {
                    DoanhNghiepId = doanhNghiep.Id,
                    DanhMucNgheId = danhMucMap[t.DanhMuc],
                    NguoiDangTinId = employerNd.Id,
                    TieuDe = t.TieuDe,
                    MoTaCongViec = t.MoTa,
                    KinhNghiemYeuCau = t.KinhNghiem,
                    YeuCauCongViec = t.YeuCau,
                    QuyenLoi = t.QuyenLoi,
                    DiaDiemLamViec = t.DiaDiem,
                    LuongToiThieu = t.LuongToiThieu,
                    LuongToiDa = t.LuongToiDa,
                    TrangThai = TrangThaiTinTuyenDung.DangTuyen,
                    NgayHetHan = DateTime.UtcNow.AddDays(30)
                });
                await appContext.SaveChangesAsync();
            }
        }
    }
}
