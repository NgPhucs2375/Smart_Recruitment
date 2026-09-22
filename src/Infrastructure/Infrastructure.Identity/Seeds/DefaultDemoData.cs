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
    /// (employer@gmail.com): doanh nghiệp, hồ sơ nhà tuyển dụng
    /// và các tin đang tuyển — để các luồng tuyển dụng (mời nhân sự, đăng tin,
    /// dashboard tổng quan) có dữ liệu hoạt động ngay lần chạy đầu.
    /// Idempotent — chỉ tạo khi chưa tồn tại trong DB.
    /// </summary>
    public static class DefaultDemoData
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            // 1. Danh mục nghề do admin quản lý trong module Danh mục nghề.
            // Seed demo chỉ đọc danh mục đã có để gắn vào các tin mẫu.
            var danhMucMap = appContext.DanhMucNghes
                .ToDictionary(d => d.TenNghe, d => d.Id);

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
                    DanhMuc = "Backend Development",
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
                    TieuDe = "Data Analyst",
                    DanhMuc = "Data Science & Analytics",
                    DiaDiem = "TP. Hồ Chí Minh",
                    LuongToiThieu = 12000000m,
                    LuongToiDa = 20000000m,
                    MoTa = "Phân tích dữ liệu tuyển dụng và xây dựng báo cáo hỗ trợ các quyết định vận hành nền tảng.",
                    KinhNghiem = "Tối thiểu 2 năm kinh nghiệm phân tích dữ liệu; thành thạo SQL và công cụ trực quan hóa.",
                    YeuCau = "Tư duy phân tích tốt; biết làm việc với dữ liệu lớn và trình bày kết quả rõ ràng.",
                    QuyenLoi = "Review lương 6 tháng/lần, phụ cấp điện thoại, team building quý."
                }
            };
            foreach (var t in tins)
            {
                if (appContext.TinTuyenDungs.Any(x => x.DoanhNghiepId == doanhNghiep.Id && x.TieuDe == t.TieuDe))
                {
                    continue;
                }
                if (!danhMucMap.TryGetValue(t.DanhMuc, out var danhMucNgheId))
                {
                    continue;
                }
                await appContext.TinTuyenDungs.AddAsync(new TinTuyenDung
                {
                    DoanhNghiepId = doanhNghiep.Id,
                    DanhMucNgheId = danhMucNgheId,
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
