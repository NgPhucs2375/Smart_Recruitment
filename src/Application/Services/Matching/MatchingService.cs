using Application.DTOs.CV;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Application.Services.Matching;

/// <summary>
/// Chấm điểm phù hợp: kỹ năng (so với KyNangTinTuyenDung + MucDoYC),
/// kinh nghiệm (khoảng thời gian làm việc so với KinhNghiemYeuCau),
/// học vấn (từ khóa trình độ trong HocVan so với YeuCauCongViec).
/// </summary>
public class MatchingService(
    IApplicationDbContext context,
    MatchingWeightOptions options)
    : IMatchingService
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<MatchingResultDto> CalculateAsync(
        int hoSoUngVienId,
        int tinTuyenDungId,
        int? cvUngVienId,
        CancellationToken cancellationToken)
    {
        var tin = await context.TinTuyenDungs
            .AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .FirstOrDefaultAsync(
                x => x.Id == tinTuyenDungId,
                cancellationToken);

        if (tin == null)
        {
            return Loi("Không tìm thấy tin tuyển dụng.");
        }

        var cvQuery = context.CVUngViens
            .AsNoTracking()
            .Where(x => x.HoSoUngVienId == hoSoUngVienId && !x.IsDaXoa);

        Domain.Entities.CVUngVien cv;

        if (cvUngVienId.HasValue)
        {
            cv = await cvQuery
                .FirstOrDefaultAsync(
                    x => x.Id == cvUngVienId.Value,
                    cancellationToken);

            if (cv == null)
            {
                return Loi("Không tìm thấy CV của ứng viên.");
            }
        }
        else
        {
            cv = await cvQuery
                .OrderByDescending(x => x.IsDefault)
                .ThenByDescending(x => x.NgayUpload)
                .FirstOrDefaultAsync(cancellationToken);

            if (cv == null)
            {
                return Loi("Ứng viên chưa có CV để chấm điểm.");
            }
        }

        TaoCVThuCong noiDung;

        try
        {
            noiDung = string.IsNullOrWhiteSpace(cv.NoiDungJson)
                ? new TaoCVThuCong()
                : JsonSerializer.Deserialize<TaoCVThuCong>(cv.NoiDungJson, _jsonOptions)
                    ?? new TaoCVThuCong();
        }
        catch (JsonException)
        {
            return Loi("Nội dung CV không đọc được để chấm điểm.");
        }

        var result = new MatchingResultDto { ThanhCong = true };

        result.DiemKyNang = ChamKyNang(
            noiDung.KyNang,
            tin.KyNangTinTuyenDungs?.ToList() ?? new(),
            result);

        result.TongSoNamKinhNghiem = TinhTongSoNamKinhNghiem(noiDung);

        result.DiemKinhNghiem = ChamKinhNghiem(
            result.TongSoNamKinhNghiem,
            tin.KinhNghiemYeuCau);

        result.DiemHocVan = ChamHocVan(
            noiDung.HocVan,
            $"{tin.YeuCauCongViec} {tin.MoTaCongViec}");

        var tong = result.DiemKyNang * options.SkillWeight
            + result.DiemKinhNghiem * options.ExperienceWeight
            + result.DiemHocVan * options.EducationWeight;

        result.DiemPhuHop = (float)Math.Round(
            Math.Clamp(tong * 100.0, 0.0, 100.0), 1);

        result.PhanLoai = result.DiemPhuHop >= options.NguongCao
            ? PhanLoaiKetQua.Cao
            : result.DiemPhuHop >= options.NguongTrungBinh
                ? PhanLoaiKetQua.TrungBinh
                : PhanLoaiKetQua.Thap;

        return result;
    }

    private double ChamKyNang(
        List<KyNangDTO> kyNangCv,
        List<Domain.Entities.KyNangTinTuyenDung> yeuCau,
        MatchingResultDto result)
    {
        var cvChuanHoa = kyNangCv
            .Where(x => !string.IsNullOrWhiteSpace(x.TenKyNang))
            .Select(x => new
            {
                Goc = x.TenKyNang.Trim(),
                Chuan = ChuanHoa(x.TenKyNang),
                MucDo = x.MucDoThanhThao
            })
            .ToList();

        if (yeuCau.Count == 0)
        {
            return cvChuanHoa.Count > 0 ? 1.0 : 0.5;
        }

        var tongTrongSo = 0.0;
        var diemDat = 0.0;

        foreach (var yc in yeuCau)
        {
            var tenYeuCau = yc.KyNang?.TenKyNang?.Trim()
                ?? string.Empty;

            if (string.IsNullOrWhiteSpace(tenYeuCau))
            {
                continue;
            }

            var trongSo = yc.MucDoYeuCau switch
            {
                MucDoYC.BatBuc => options.TrongSoBatBuoc,
                MucDoYC.UuTien => options.TrongSoUuTien,
                _ => options.TrongSoKhongBatBuoc
            };

            tongTrongSo += trongSo;

            var tenChuan = ChuanHoa(tenYeuCau);
            var khop = cvChuanHoa.FirstOrDefault(x =>
                x.Chuan == tenChuan
                || x.Chuan.Contains(tenChuan)
                || tenChuan.Contains(x.Chuan));

            if (khop == null)
            {
                result.KyNangThieu.Add(tenYeuCau);
                continue;
            }

            result.KyNangThoa.Add(khop.Goc);

            var heSoThanhThao = (int)khop.MucDo / 3.0;

            diemDat += trongSo
                * (options.TyLeDiemCoBanKhiKhop
                    + (1.0 - options.TyLeDiemCoBanKhiKhop) * heSoThanhThao);
        }

        if (tongTrongSo <= 0)
        {
            return cvChuanHoa.Count > 0 ? 1.0 : 0.5;
        }

        return Math.Clamp(diemDat / tongTrongSo, 0.0, 1.0);
    }

    private double ChamKinhNghiem(double soNamCv, string kinhNghiemYeuCau)
    {
        var soNamYeuCau = TrichSoNam(kinhNghiemYeuCau);

        if (!soNamYeuCau.HasValue)
        {
            return soNamCv > 0 ? 1.0 : 0.5;
        }

        if (soNamYeuCau.Value <= 0)
        {
            return 1.0;
        }

        return Math.Clamp(soNamCv / soNamYeuCau.Value, 0.0, 1.0);
    }

    private double ChamHocVan(List<HocVanDTO> hocVan, string yeuCauCongViec)
    {
        var capDoYeuCau = TrichCapDoHocVan(yeuCauCongViec);

        if (capDoYeuCau == 0)
        {
            return hocVan.Count > 0 ? 1.0 : 0.5;
        }

        var capDoCv = hocVan
            .Select(x => TrichCapDoHocVan($"{x.Truong} {x.ChuyenNganh} {x.MoTa}"))
            .DefaultIfEmpty(0)
            .Max();

        if (capDoCv >= capDoYeuCau)
        {
            return 1.0;
        }

        return Math.Clamp((double)capDoCv / capDoYeuCau, 0.0, 1.0);
    }

    private static double TinhTongSoNamKinhNghiem(TaoCVThuCong noiDung)
    {
        var tong = 0.0;
        var now = DateTime.UtcNow;

        foreach (var kn in noiDung.KinhNghiemLamViec)
        {
            if (!kn.TuNgay.HasValue)
            {
                continue;
            }

            var denNgay = kn.IsHienTai || !kn.DenNgay.HasValue
                ? now
                : kn.DenNgay.Value;

            if (denNgay < kn.TuNgay.Value)
            {
                continue;
            }

            tong += (denNgay - kn.TuNgay.Value).TotalDays / 365.0;
        }

        var soNamKhaiBao = noiDung.KyNang
            .Where(x => x.SoNamKinhNghiem.HasValue)
            .Sum(x => x.SoNamKinhNghiem!.Value);

        return Math.Max(tong, soNamKhaiBao);
    }

    private static double? TrichSoNam(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var khop = Regex.Matches(
            ChuanHoa(text),
            @"(\d+(?:[.,]\d+)?)\s*(nam|year)");

        double? max = null;

        foreach (Match m in khop)
        {
            if (double.TryParse(
                m.Groups[1].Value.Replace(',', '.'),
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var soNam))
            {
                max = max.HasValue ? Math.Max(max.Value, soNam) : soNam;
            }
        }

        return max;
    }

    /// <summary>5 = tiến sĩ, 4 = thạc sĩ, 3 = đại học/cử nhân, 2 = cao đẳng, 1 = trung cấp.</summary>
    private static int TrichCapDoHocVan(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        var chuan = ChuanHoa(text);

        if (chuan.Contains("tien si"))
        {
            return 5;
        }

        if (chuan.Contains("thac si"))
        {
            return 4;
        }

        if (chuan.Contains("dai hoc") || chuan.Contains("cu nhan"))
        {
            return 3;
        }

        if (chuan.Contains("cao dang"))
        {
            return 2;
        }

        if (chuan.Contains("trung cap"))
        {
            return 1;
        }

        return 0;
    }

    private static string ChuanHoa(string text)
    {
        var khongDau = new string(
            text.Trim().ToLowerInvariant()
                .Normalize(NormalizationForm.FormD)
                .Where(c => CharUnicodeInfo.GetUnicodeCategory(c)
                    != UnicodeCategory.NonSpacingMark)
                .ToArray())
            .Normalize(NormalizationForm.FormC);

        return Regex.Replace(khongDau, @"\s+", " ");
    }

    private static MatchingResultDto Loi(string thongBao)
    {
        return new MatchingResultDto
        {
            ThanhCong = false,
            ThongBaoLoi = thongBao,
            DiemPhuHop = 0,
            PhanLoai = PhanLoaiKetQua.Thap
        };
    }
}
