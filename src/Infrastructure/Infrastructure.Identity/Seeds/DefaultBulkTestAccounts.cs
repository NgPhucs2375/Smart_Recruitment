using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using System.Linq;
using System;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    /// <summary>
    /// Bơm tài khoản test số lượng lớn, idempotent (chạy lại không tạo trùng):
    /// - 10 NGUOI_DAI_DIEN, mỗi người sở hữu 1 DoanhNghiep + HoSoNhaTuyenDung riêng (MST duy nhất).
    /// - Mỗi DoanhNghiep trong DB (kể cả DN demo của employer@gmail.com) có thêm 5 NHAN_SU
    ///   (NguoiDung VaiTro=NHAN_SU + HoSoNhaTuyenDung gắn DoanhNghiep — cùng hình hài
    ///   như nhân sự tạo qua lời mời, chỉ khác là không qua token).
    /// - 10 UNG_VIEN (NguoiDung + HoSoUngVien để test được luồng tạo CV/ứng tuyển).
    /// Mật khẩu chung: 123Pa$$word! — EmailConfirmed=true để đăng nhập ngay.
    /// </summary>
    public static class DefaultBulkTestAccounts
    {
        private const string Password = "123Pa$$word!";

        private static readonly (string UserName, string Email, string FirstName, string LastName,
            string HoTen, string Sdt, string ChucVu,
            string TenDn, string Website, string DiaChi, string Mst, string LinhVuc, string QuyMo)[] NguoiDaiDiens =
        {
            ("daidien.saokhue", "daidien.saokhue@seed.local", "An", "Nguyễn Văn", "Nguyễn Văn An", "0911000001", "Giám đốc điều hành",
             "Công ty TNHH Phần mềm Sao Khuê", "https://saokhue.example.com", "Tòa nhà Sao Khuê, Duy Tân, Cầu Giấy, Hà Nội", "0109876501", "Công nghệ thông tin", "50-100 nhân viên"),
            ("daidien.mekong", "daidien.mekong@seed.local", "Bích", "Trần Thị", "Trần Thị Bích", "0911000002", "Giám đốc điều hành",
             "Công ty CP Dữ liệu Mekong", "https://mekongdata.example.com", "Quận 1, TP. Hồ Chí Minh", "0319876502", "Công nghệ thông tin", "100-200 nhân viên"),
            ("daidien.anphat", "daidien.anphat@seed.local", "Cường", "Lê Hoàng", "Lê Hoàng Cường", "0911000003", "Tổng giám đốc",
             "Công ty TNHH Thương mại An Phát", "https://anphat.example.com", "KCN Tân Bình, TP. Hồ Chí Minh", "0319876503", "Bán hàng / Kinh doanh", "20-50 nhân viên"),
            ("daidien.saoviet", "daidien.saoviet@seed.local", "Đức", "Phạm Minh", "Phạm Minh Đức", "0911000004", "Giám đốc chi nhánh",
             "Công ty CP Logistics Sao Việt", "https://saovietlog.example.com", "Cảng Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh", "0319876504", "Logistics / Chuỗi cung ứng", "100-200 nhân viên"),
            ("daidien.pixel", "daidien.pixel@seed.local", "Hà", "Hoàng Thu", "Hoàng Thu Hà", "0911000005", "Founder",
             "Công ty TNHH Thiết kế Pixel House", "https://pixelhouse.example.com", "Tây Hồ, Hà Nội", "0109876505", "Thiết kế / Đồ họa", "10-20 nhân viên"),
            ("daidien.thinhvuong", "daidien.thinhvuong@seed.local", "Khánh", "Vũ Quốc", "Vũ Quốc Khánh", "0911000006", "Giám đốc nhân sự",
             "Công ty CP Tài chính Thịnh Vượng", "https://thinhvuong.example.com", "Hoàn Kiếm, Hà Nội", "0109876506", "Tài chính / Ngân hàng", "200-500 nhân viên"),
            ("daidien.xanhfarm", "daidien.xanhfarm@seed.local", "Lan", "Đỗ Thị", "Đỗ Thị Lan", "0911000007", "Giám đốc điều hành",
             "Công ty TNHH Thực phẩm Xanh Farm", "https://xanhfarm.example.com", "Đà Lạt, Lâm Đồng", "5809876507", "Sản xuất / Nông nghiệp", "20-50 nhân viên"),
            ("daidien.trithuc", "daidien.trithuc@seed.local", "Dũng", "Bùi Tiến", "Bùi Tiến Dũng", "0911000008", "Hiệu trưởng",
             "Công ty CP Giáo dục Tri Thức Việt", "https://trithucviet.example.com", "Thanh Xuân, Hà Nội", "0109876508", "Giáo dục / Đào tạo", "50-100 nhân viên"),
            ("daidien.donganh", "daidien.donganh@seed.local", "Linh", "Nguyễn Ngọc", "Nguyễn Ngọc Linh", "0911000009", "Phó giám đốc",
             "Công ty TNHH Cơ khí Chính xác Đông Anh", "https://donganhmech.example.com", "Đông Anh, Hà Nội", "0109876509", "Kỹ thuật / Sản xuất", "50-100 nhân viên"),
            ("daidien.bienngoc", "daidien.bienngoc@seed.local", "Phúc", "Trịnh Văn", "Trịnh Văn Phúc", "0911000010", "Giám đốc điều hành",
             "Công ty CP Du lịch Biển Ngọc", "https://bienngoc.example.com", "Nha Trang, Khánh Hòa", "4409876510", "Du lịch / Khách sạn", "20-50 nhân viên"),
        };

        private static readonly string[] HoNhanSu = { "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đỗ", "Bùi", "Trịnh", "Đặng" };
        private static readonly string[] TenNhanSu = { "Hùng", "Hương", "Tuấn", "Lan", "Hoàng", "Nga", "Nam", "Thắng", "Hoa", "Dương", "Quân", "Thảo", "Vinh", "Yến", "Bảo" };
        private static readonly string[] ChucVuNhanSu =
        {
            "Chuyên viên tuyển dụng", "Trưởng nhóm tuyển dụng", "Chuyên viên C&B",
            "Chuyên viên đào tạo", "Nhân viên hành chính nhân sự"
        };

        private static readonly (string UserName, string Email, string FirstName, string LastName,
            string HoTen, string Sdt, string GioiTinh, string DiaChi, string ViTri, double LuongMongMuon)[] UngViens =
        {
            ("ungvien.mai", "ungvien.mai@seed.local", "Mai", "Nguyễn Thị", "Nguyễn Thị Mai", "0987000001", "Nữ", "Cầu Giấy, Hà Nội", "Frontend Developer", 18000000),
            ("ungvien.hung", "ungvien.hung@seed.local", "Hùng", "Trần Văn", "Trần Văn Hùng", "0987000002", "Nam", "Bình Thạnh, TP. Hồ Chí Minh", "Backend Developer (.NET)", 25000000),
            ("ungvien.huong", "ungvien.huong@seed.local", "Hương", "Lê Thị", "Lê Thị Hương", "0987000003", "Nữ", "Hải Châu, Đà Nẵng", "Kế toán tổng hợp", 14000000),
            ("ungvien.tuan", "ungvien.tuan@seed.local", "Tuấn", "Phạm Văn", "Phạm Văn Tuấn", "0987000004", "Nam", "Đống Đa, Hà Nội", "Nhân viên Marketing", 12000000),
            ("ungvien.lan", "ungvien.lan@seed.local", "Lan", "Hoàng Thị", "Hoàng Thị Lan", "0987000005", "Nữ", "Quận 3, TP. Hồ Chí Minh", "Chuyên viên tuyển dụng", 13000000),
            ("ungvien.mhoang", "ungvien.mhoang@seed.local", "Hoàng", "Vũ Minh", "Vũ Minh Hoàng", "0987000006", "Nam", "Thủ Đức, TP. Hồ Chí Minh", "Nhân viên kinh doanh", 15000000),
            ("ungvien.nga", "ungvien.nga@seed.local", "Nga", "Đỗ Thị", "Đỗ Thị Nga", "0987000007", "Nữ", "Thanh Xuân, Hà Nội", "UI/UX Designer", 20000000),
            ("ungvien.nam", "ungvien.nam@seed.local", "Nam", "Bùi Văn", "Bùi Văn Nam", "0987000008", "Nam", "Cần Thơ", "Data Analyst", 22000000),
            ("ungvien.thang", "ungvien.thang@seed.local", "Thắng", "Nguyễn Văn", "Nguyễn Văn Thắng", "0987000009", "Nam", "Hai Bà Trưng, Hà Nội", "Tester/QC", 16000000),
            ("ungvien.hoa", "ungvien.hoa@seed.local", "Hoa", "Trịnh Thị", "Trịnh Thị Hoa", "0987000010", "Nữ", "Biên Hòa, Đồng Nai", "Nhân viên kho", 10000000),
        };

        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            await SeedNguoiDaiDiensAsync(userManager, appContext);
            await SeedNhanSusAsync(userManager, appContext);
            await SeedUngViensAsync(userManager, appContext);
        }

        // 1. 10 NGUOI_DAI_DIEN + DoanhNghiep + HoSoNhaTuyenDung riêng từng người.
        private static async Task SeedNguoiDaiDiensAsync(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            foreach (var d in NguoiDaiDiens)
            {
                var user = await EnsureIdentityUserAsync(userManager, d.Email, d.UserName, d.FirstName, d.LastName,
                    VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString());

                var nd = await appContext.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == user.Id);
                if (nd == null)
                {
                    nd = new NguoiDung { ApplicationUserId = user.Id, VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN, IsActive = true };
                    await appContext.NguoiDungs.AddAsync(nd);
                    await appContext.SaveChangesAsync();
                }
                else if (nd.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN || !nd.IsActive)
                {
                    nd.VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN;
                    nd.IsActive = true;
                    await appContext.SaveChangesAsync();
                }

                var dn = await appContext.DoanhNghieps.FirstOrDefaultAsync(x => x.NguoiDaiDienId == nd.Id);
                if (dn == null)
                {
                    // 1-1 nghiêm ngặt: MST phải duy nhất — bỏ qua nếu MST đã thuộc DN khác.
                    if (await appContext.DoanhNghieps.AnyAsync(x => x.MaSoThue == d.Mst)) continue;
                    dn = new DoanhNghiep
                    {
                        TenDoanhNghiep = d.TenDn,
                        MoTa = $"Doanh nghiệp demo gắn với tài khoản người đại diện ({d.Email}).",
                        Website = d.Website,
                        DiaChi = d.DiaChi,
                        MaSoThue = d.Mst,
                        LinhVucHoatDong = d.LinhVuc,
                        QuyMoNhanSu = d.QuyMo,
                        NguoiDaiDienId = nd.Id
                    };
                    await appContext.DoanhNghieps.AddAsync(dn);
                    await appContext.SaveChangesAsync();
                }

                if (!await appContext.HoSoNhaTuyenDungs.AnyAsync(h => h.NguoiDungId == nd.Id))
                {
                    await appContext.HoSoNhaTuyenDungs.AddAsync(new HoSoNhaTuyenDung
                    {
                        NguoiDungId = nd.Id,
                        DoanhNghiepId = dn.Id,
                        HoTen = d.HoTen,
                        SDT = d.Sdt,
                        ChucVu = d.ChucVu
                    });
                    await appContext.SaveChangesAsync();
                }
            }
        }

        // 2. Mỗi DoanhNghiep trong DB thêm đủ 5 NHAN_SU (định danh bằng email ổn định theo DN).
        private static async Task SeedNhanSusAsync(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            var doanhNghieps = await appContext.DoanhNghieps.AsNoTracking().ToListAsync();
            foreach (var dn in doanhNghieps)
            {
                for (var i = 1; i <= 5; i++)
                {
                    var email = $"nhansu.dn{dn.Id}.{i:00}@seed.local";
                    var userName = $"nhansu.dn{dn.Id}.{i:00}";
                    var ho = HoNhanSu[(dn.Id + i) % HoNhanSu.Length];
                    var ten = TenNhanSu[(dn.Id * 5 + i) % TenNhanSu.Length];
                    var hoTen = $"{ho} Văn {ten}";

                    var user = await EnsureIdentityUserAsync(userManager, email, userName, ten, ho,
                        VaiTroNguoiDung.NHAN_SU.ToString());

                    var nd = await appContext.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == user.Id);
                    if (nd == null)
                    {
                        nd = new NguoiDung { ApplicationUserId = user.Id, VaiTro = VaiTroNguoiDung.NHAN_SU, IsActive = true };
                        await appContext.NguoiDungs.AddAsync(nd);
                        await appContext.SaveChangesAsync();
                    }
                    else if (nd.VaiTro != VaiTroNguoiDung.NHAN_SU || !nd.IsActive)
                    {
                        nd.VaiTro = VaiTroNguoiDung.NHAN_SU;
                        nd.IsActive = true;
                        await appContext.SaveChangesAsync();
                    }

                    if (!await appContext.HoSoNhaTuyenDungs.AnyAsync(h => h.NguoiDungId == nd.Id))
                    {
                        await appContext.HoSoNhaTuyenDungs.AddAsync(new HoSoNhaTuyenDung
                        {
                            NguoiDungId = nd.Id,
                            DoanhNghiepId = dn.Id,
                            HoTen = hoTen,
                            SDT = $"09{(dn.Id * 5 + i):0000}{(i * 37 + 11):0000}",
                            ChucVu = ChucVuNhanSu[(i - 1) % ChucVuNhanSu.Length]
                        });
                        await appContext.SaveChangesAsync();
                    }
                }
            }
        }

        // 3. 10 UNG_VIEN (NguoiDung + HoSoUngVien để test luồng tạo CV/ứng tuyển ngay).
        private static async Task SeedUngViensAsync(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            var idx = 0;
            foreach (var u in UngViens)
            {
                var user = await EnsureIdentityUserAsync(userManager, u.Email, u.UserName, u.FirstName, u.LastName,
                    VaiTroNguoiDung.UNG_VIEN.ToString());

                var nd = await appContext.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == user.Id);
                if (nd == null)
                {
                    nd = new NguoiDung { ApplicationUserId = user.Id, VaiTro = VaiTroNguoiDung.UNG_VIEN, IsActive = true };
                    await appContext.NguoiDungs.AddAsync(nd);
                    await appContext.SaveChangesAsync();
                }
                else if (nd.VaiTro != VaiTroNguoiDung.UNG_VIEN || !nd.IsActive)
                {
                    nd.VaiTro = VaiTroNguoiDung.UNG_VIEN;
                    nd.IsActive = true;
                    await appContext.SaveChangesAsync();
                }

                if (!await appContext.HoSoUngViens.AnyAsync(h => h.NguoiDungId == nd.Id))
                {
                    await appContext.HoSoUngViens.AddAsync(new HoSoUngVien
                    {
                        NguoiDungId = nd.Id,
                        HoTen = u.HoTen,
                        SDT = u.Sdt,
                        NgaySinh = new DateTime(1995 + (idx % 8), (idx % 12) + 1, (idx * 3 % 27) + 1, 0, 0, 0, DateTimeKind.Utc),
                        GioiTinh = u.GioiTinh,
                        DiaChi = u.DiaChi,
                        GioiThieu = $"Ứng viên demo ({u.Email}) dùng để kiểm thử các luồng ứng tuyển.",
                        ViTriUngTuyen = u.ViTri,
                        MucLuongMongMuon = u.LuongMongMuon,
                        IsTimViec = true
                    });
                    await appContext.SaveChangesAsync();
                }
                idx++;
            }
        }

        // Tạo mới hoặc chuẩn hóa tài khoản Identity đã tồn tại (mật khẩu/confirm/unlock/role).
        private static async Task<ApplicationUser> EnsureIdentityUserAsync(
            UserManager<ApplicationUser> userManager,
            string email, string userName, string firstName, string lastName, string role)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = userName,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true
                };
                var createResult = await userManager.CreateAsync(user, Password);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Không thể tạo tài khoản seed ({email}): {string.Join("; ", createResult.Errors.Select(error => error.Description))}");
                }
            }
            else
            {
                if (!await userManager.CheckPasswordAsync(user, Password))
                {
                    var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                    await userManager.ResetPasswordAsync(user, resetToken, Password);
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    await userManager.UpdateAsync(user);
                }

                if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow)
                {
                    await userManager.SetLockoutEndDateAsync(user, null);
                }
            }

            if (!await userManager.IsInRoleAsync(user, role))
                await userManager.AddToRoleAsync(user, role);

            return user;
        }
    }
}
