using System.Globalization;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using Domain.Entities;

namespace Application.Features.CVUngVien;

internal static class CvEntityMapper
{
    public static void ApplyContent(Domain.Entities.CVUngVien entity, ParsedCvDto source)
    {
        entity.ThongTinLienHe ??= new CVThongTinLienHe();
        var contact = source.ThongTinLienHe;
        entity.ThongTinLienHe.HoTen = contact.HoTen!;
        entity.ThongTinLienHe.Email = contact.Email;
        entity.ThongTinLienHe.SDT = contact.SDT;
        entity.ThongTinLienHe.DiaChi = contact.DiaChi;
        entity.ThongTinLienHe.GitHub = contact.GitHub;
        entity.ThongTinLienHe.LinkedIn = contact.LinkedIn;
        entity.ThongTinLienHe.Portfolio = contact.Portfolio;
        entity.ThongTinLienHe.GioiTinh = contact.GioiTinh;
        entity.ThongTinLienHe.NgaySinh = CvImportDateParser.ParseDate(contact.NgaySinh);
        entity.ThongTinLienHe.ViTriUngTuyen = contact.ViTriUngTuyen;
        entity.ThongTinLienHe.MucLuongMongMuon = contact.MucLuongMongMuon;
        entity.ThongTinLienHe.GioiThieuBanThan = contact.GioiThieuBanThan;
        entity.ThongTinLienHe.AnhDaiDienUrl = contact.AnhDaiDienUrl;

        entity.HocVans.Clear();
        foreach (var item in source.HocVan)
        {
            var (fromMonth, fromYear) = CvImportDateParser.ParseMonthYear(item.TuNgay);
            var (toMonth, toYear) = CvImportDateParser.ParseMonthYear(item.DenNgay);
            entity.HocVans.Add(new CVHocVan
            {
                Truong = item.Truong!,
                ChuyenNganh = item.ChuyenNganh,
                TuThang = fromMonth,
                TuNam = fromYear,
                DenThang = toMonth,
                DenNam = toYear,
                IsHienTai = item.IsHienTai,
                MoTa = item.MoTa,
                ThuTu = item.ThuTu
            });
        }

        entity.KinhNghiems.Clear();
        foreach (var item in source.KinhNghiemLamViec)
        {
            var (fromMonth, fromYear) = CvImportDateParser.ParseMonthYear(item.TuNgay);
            var (toMonth, toYear) = CvImportDateParser.ParseMonthYear(item.DenNgay);
            entity.KinhNghiems.Add(new CVKinhNghiemLamViec
            {
                CongTy = item.TenCongTy!,
                ChucDanh = item.ChucDanh!,
                TuThang = fromMonth,
                TuNam = fromYear,
                DenThang = toMonth,
                DenNam = toYear,
                IsHienTai = item.IsHienTai,
                MoTa = item.MoTa,
                ThuTu = item.ThuTu,
                KyNangs = item.KyNangSuDung.Select(x => new CVKinhNghiemKyNang
                {
                    KyNangId = x.KyNangId,
                    TenKyNang = x.TenKyNang
                }).ToList()
            });
        }

        entity.DuAns.Clear();
        foreach (var item in source.DuAn)
        {
            var (fromMonth, fromYear) = CvImportDateParser.ParseMonthYear(item.TuNgay);
            var (toMonth, toYear) = CvImportDateParser.ParseMonthYear(item.DenNgay);
            entity.DuAns.Add(new CVDuAn
            {
                TenDuAn = item.TenDuAn!,
                VaiTro = item.VaiTro,
                Link = item.Link,
                MoTa = item.MoTa,
                TuThang = fromMonth,
                TuNam = fromYear,
                DenThang = toMonth,
                DenNam = toYear,
                IsHienTai = item.IsHienTai,
                ThuTu = item.ThuTu,
                CongNghes = item.CongNghe.Select(x => new CVDuAnCongNghe
                {
                    KyNangId = x.KyNangId,
                    TenCongNghe = x.TenKyNang
                }).ToList()
            });
        }

        entity.KyNangs.Clear();
        foreach (var item in source.KyNang)
        {
            entity.KyNangs.Add(new CVKyNang
            {
                KyNangId = item.KyNangId,
                TenKyNang = item.TenKyNang,
                MucDoThanhThao = item.MucDoThanhThao,
                SoNamKinhNghiem = item.SoNamKinhNghiem,
                ThuTu = item.ThuTu
            });
        }

        entity.ChungChis.Clear();
        foreach (var item in source.ChungChi)
        {
            entity.ChungChis.Add(new CVChungChi
            {
                TenChungChi = item.TenChungChi!,
                DonViCap = item.DonViCap,
                NgayCap = CvImportDateParser.ParseDate(item.NgayCap),
                NgayHetHan = CvImportDateParser.ParseDate(item.NgayHetHan),
                MaXacMinh = item.MaXacMinh,
                CredentialUrl = item.CredentialUrl,
                ThuTu = item.ThuTu
            });
        }
    }

    public static ParsedCvDto ToDto(Domain.Entities.CVUngVien entity) => new()
    {
        ThongTinLienHe = new ParsedThongTinLienHeDto
        {
            HoTen = entity.ThongTinLienHe?.HoTen,
            Email = entity.ThongTinLienHe?.Email,
            SDT = entity.ThongTinLienHe?.SDT,
            DiaChi = entity.ThongTinLienHe?.DiaChi,
            GitHub = entity.ThongTinLienHe?.GitHub,
            LinkedIn = entity.ThongTinLienHe?.LinkedIn,
            Portfolio = entity.ThongTinLienHe?.Portfolio,
            GioiTinh = entity.ThongTinLienHe?.GioiTinh,
            NgaySinh = FormatDate(entity.ThongTinLienHe?.NgaySinh),
            ViTriUngTuyen = entity.ThongTinLienHe?.ViTriUngTuyen,
            MucLuongMongMuon = entity.ThongTinLienHe?.MucLuongMongMuon,
            GioiThieuBanThan = entity.ThongTinLienHe?.GioiThieuBanThan,
            AnhDaiDienUrl = entity.ThongTinLienHe?.AnhDaiDienUrl
        },
        HocVan = entity.HocVans.OrderBy(x => x.ThuTu).Select(x => new ParsedHocVanDto
        {
            Truong = x.Truong,
            ChuyenNganh = x.ChuyenNganh,
            TuNgay = FormatMonthYear(x.TuThang, x.TuNam),
            DenNgay = FormatMonthYear(x.DenThang, x.DenNam),
            IsHienTai = x.IsHienTai,
            MoTa = x.MoTa,
            ThuTu = x.ThuTu
        }).ToList(),
        KinhNghiemLamViec = entity.KinhNghiems.OrderBy(x => x.ThuTu).Select(x => new ParsedKinhNghiemDto
        {
            TenCongTy = x.CongTy,
            ChucDanh = x.ChucDanh,
            TuNgay = FormatMonthYear(x.TuThang, x.TuNam),
            DenNgay = FormatMonthYear(x.DenThang, x.DenNam),
            IsHienTai = x.IsHienTai,
            MoTa = x.MoTa,
            ThuTu = x.ThuTu,
            KyNangSuDung = x.KyNangs.Select(k => new ParsedKyNangThamChieuDto
            {
                KyNangId = k.KyNangId,
                TenKyNang = k.TenKyNang
            }).ToList()
        }).ToList(),
        DuAn = entity.DuAns.OrderBy(x => x.ThuTu).Select(x => new ParsedDuAnDto
        {
            TenDuAn = x.TenDuAn,
            VaiTro = x.VaiTro,
            TuNgay = FormatMonthYear(x.TuThang, x.TuNam),
            DenNgay = FormatMonthYear(x.DenThang, x.DenNam),
            IsHienTai = x.IsHienTai,
            Link = x.Link,
            MoTa = x.MoTa,
            ThuTu = x.ThuTu,
            CongNghe = x.CongNghes.Select(k => new ParsedKyNangThamChieuDto
            {
                KyNangId = k.KyNangId,
                TenKyNang = k.TenCongNghe
            }).ToList()
        }).ToList(),
        KyNang = entity.KyNangs.OrderBy(x => x.ThuTu).Select(x => new ParsedKyNangDto
        {
            KyNangId = x.KyNangId,
            TenKyNang = x.TenKyNang,
            MucDoThanhThao = x.MucDoThanhThao,
            SoNamKinhNghiem = x.SoNamKinhNghiem,
            ThuTu = x.ThuTu
        }).ToList(),
        ChungChi = entity.ChungChis.OrderBy(x => x.ThuTu).Select(x => new ParsedChungChiDto
        {
            TenChungChi = x.TenChungChi,
            DonViCap = x.DonViCap,
            NgayCap = FormatDate(x.NgayCap),
            NgayHetHan = FormatDate(x.NgayHetHan),
            MaXacMinh = x.MaXacMinh,
            CredentialUrl = x.CredentialUrl,
            ThuTu = x.ThuTu
        }).ToList()
    };

    public static List<int> GetKyNangIds(ParsedCvDto source) => source.KyNang
        .Select(x => x.KyNangId)
        .Concat(source.KinhNghiemLamViec.SelectMany(x => x.KyNangSuDung).Select(x => x.KyNangId))
        .Concat(source.DuAn.SelectMany(x => x.CongNghe).Select(x => x.KyNangId))
        .Where(x => x.HasValue)
        .Select(x => x!.Value)
        .Distinct()
        .ToList();

    private static string? FormatDate(DateTime? value) =>
        value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

    private static string? FormatMonthYear(int? month, int? year) =>
        month.HasValue && year.HasValue ? $"{month:00}/{year:0000}" : null;
}
