using System.Globalization;
using Application.DTOs.CV;
using Application.Interfaces.Repositories;
using Domain.Entities;

namespace Application.Mappings;

public class CvReadMapper : ICvReadMapper
{
    public CvDetailDto Map(CVUngVien cv)
    {
        return new CvDetailDto
        {
            Id = cv.Id,

            TenFile = cv.TenFile,

            FileUrl = cv.FileUrl,

            TemplateId = cv.TemplateId,

            IsDefault = cv.IsDefault,

            PhuongThucTao = cv.PhuongThucTao,

            NoiDung = new ParsedCvDto
            {
                ThongTinLienHe =
                    MapThongTinLienHe(cv.ThongTinLienHe),

                HocVan = cv.HocVans
                    .OrderBy(x => x.ThuTu)
                    .Select(MapHocVan)
                    .ToList(),

                KinhNghiemLamViec = cv.KinhNghiems
                    .OrderBy(x => x.ThuTu)
                    .Select(MapKinhNghiem)
                    .ToList(),

                DuAn = cv.DuAns
                    .OrderBy(x => x.ThuTu)
                    .Select(MapDuAn)
                    .ToList(),

                KyNang = cv.KyNangs
                    .OrderBy(x => x.ThuTu)
                    .Select(MapKyNang)
                    .ToList(),

                ChungChi = cv.ChungChis
                    .OrderBy(x => x.ThuTu)
                    .Select(MapChungChi)
                    .ToList()
            }
        };
    }

    private static ParsedThongTinLienHeDto MapThongTinLienHe(
        CVThongTinLienHe? source)
    {
        if (source == null)
        {
            return new ParsedThongTinLienHeDto();
        }

        return new ParsedThongTinLienHeDto
        {
            HoTen = source.HoTen,

            Email = source.Email,

            SDT = source.SDT,

            DiaChi = source.DiaChi,

            GitHub = source.GitHub,

            LinkedIn = source.LinkedIn,

            Portfolio = source.Portfolio,

            GioiTinh = source.GioiTinh,

            NgaySinh = FormatDate(source.NgaySinh),

            ViTriUngTuyen = source.ViTriUngTuyen,

            MucLuongMongMuon =
                source.MucLuongMongMuon,

            GioiThieuBanThan =
                source.GioiThieuBanThan,

            AnhDaiDienUrl =
                source.AnhDaiDienUrl
        };
    }

    private static ParsedHocVanDto MapHocVan(
        CVHocVan source)
    {
        return new ParsedHocVanDto
        {
            Truong = source.Truong,

            ChuyenNganh =
                source.ChuyenNganh,

            TuNgay =
                FormatMonthYear(
                    source.TuThang,
                    source.TuNam),

            DenNgay =
                FormatMonthYear(
                    source.DenThang,
                    source.DenNam),

            IsHienTai =
                source.IsHienTai,

            MoTa =
                source.MoTa,

            ThuTu =
                source.ThuTu
        };
    }

    private static ParsedKinhNghiemDto MapKinhNghiem(
        CVKinhNghiemLamViec source)
    {
        return new ParsedKinhNghiemDto
        {
            TenCongTy =
                source.CongTy,

            ChucDanh =
                source.ChucDanh,

            TuNgay =
                FormatMonthYear(
                    source.TuThang,
                    source.TuNam),

            DenNgay =
                FormatMonthYear(
                    source.DenThang,
                    source.DenNam),

            IsHienTai =
                source.IsHienTai,

            MoTa =
                source.MoTa,

            ThuTu =
                source.ThuTu,

            KyNangSuDung =
                source.KyNangs
                    .Select(x =>
                        new ParsedKyNangThamChieuDto
                        {
                            KyNangId =
                                x.KyNangId,

                            TenKyNang =
                                x.TenKyNang
                        })
                    .ToList()
        };
    }

    private static ParsedDuAnDto MapDuAn(
        CVDuAn source)
    {
        return new ParsedDuAnDto
        {
            TenDuAn =
                source.TenDuAn,

            VaiTro =
                source.VaiTro,

            Link =
                source.Link,

            MoTa =
                source.MoTa,

            TuNgay =
                FormatMonthYear(
                    source.TuThang,
                    source.TuNam),

            DenNgay =
                FormatMonthYear(
                    source.DenThang,
                    source.DenNam),

            IsHienTai =
                source.IsHienTai,

            ThuTu =
                source.ThuTu,

            CongNghe =
                source.CongNghes
                    .Select(x =>
                        new ParsedKyNangThamChieuDto
                        {
                            KyNangId =
                                x.KyNangId,

                            TenKyNang =
                                x.TenCongNghe
                        })
                    .ToList()
        };
    }

    private static ParsedKyNangDto MapKyNang(
        CVKyNang source)
    {
        return new ParsedKyNangDto
        {
            KyNangId =
                source.KyNangId,

            TenKyNang =
                source.TenKyNang,

            MucDoThanhThao =
                source.MucDoThanhThao,

            SoNamKinhNghiem =
                source.SoNamKinhNghiem,

            ThuTu =
                source.ThuTu
        };
    }

    private static ParsedChungChiDto MapChungChi(
        CVChungChi source)
    {
        return new ParsedChungChiDto
        {
            TenChungChi =
                source.TenChungChi,

            DonViCap =
                source.DonViCap,

            NgayCap =
                FormatDate(source.NgayCap),

            NgayHetHan =
                FormatDate(source.NgayHetHan),

            MaXacMinh =
                source.MaXacMinh,

            CredentialUrl =
                source.CredentialUrl,

            ThuTu =
                source.ThuTu
        };
    }

    private static string? FormatMonthYear(
        int? month,
        int? year)
    {
        if (!month.HasValue ||
            !year.HasValue)
        {
            return null;
        }

        return $"{month.Value:D2}/{year.Value:D4}";
    }

    private static string? FormatDate(
        DateTime? date)
    {
        return date?.ToString(
            "dd/MM/yyyy",
            CultureInfo.InvariantCulture);
    }
}
