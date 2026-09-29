using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;

public class GetSuggestedCandidatesForJobQuery : IRequest<Response<List<SuggestedCandidateViewModel>>>
{
    public int TinTuyenDungId { get; set; }
    public int TopN { get; set; } = 10;
}

public class SuggestedCandidateViewModel
{
    public int HoSoUngVienId { get; set; }
    public int CvUngVienId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ViTriUngTuyen { get; set; } = string.Empty;
    public float DiemPhuHop { get; set; }
    public string PhanLoai { get; set; } = string.Empty;
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    public int SoNamKinhNghiem { get; set; }
}

public class GetSuggestedCandidatesForJobQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<GetSuggestedCandidatesForJobQuery, Response<List<SuggestedCandidateViewModel>>>
{
    private static readonly Dictionary<MucDoYC, float> MucDoWeights = new()
    {
        [MucDoYC.BatBuc] = 3f,
        [MucDoYC.UuTien] = 2f,
        [MucDoYC.KhongBatBuoc] = 1f,
    };

    private static string Norm(string? value) => (value ?? string.Empty).Trim().ToLowerInvariant();

    public async Task<Response<List<SuggestedCandidateViewModel>>> Handle(
        GetSuggestedCandidatesForJobQuery request,
        CancellationToken cancellationToken)
    {
        var current = await currentNguoiDungService.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Response<List<SuggestedCandidateViewModel>>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Response<List<SuggestedCandidateViewModel>>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var job = await context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId &&
                                      x.DoanhNghiepId == current.DoanhNghiepId.Value,
                cancellationToken);
        if (job == null)
            return new Response<List<SuggestedCandidateViewModel>>("Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.");

        var requirements = job.KyNangTinTuyenDungs
            .Where(x => x.KyNang != null && !string.IsNullOrWhiteSpace(x.KyNang.TenKyNang))
            .ToList();
        var now = DateTime.UtcNow;
        var cvs = await context.CVUngViens.AsNoTracking()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.KyNangs)
            .Include(x => x.HoSoUngVien)
                .ThenInclude(x => x.KinhNghiemLamViecs)
            .Where(x => x.IsDefault && !x.IsDaXoa && x.HoSoUngVien.IsTimViec)
            .ToListAsync(cancellationToken);

        var results = new List<SuggestedCandidateViewModel>();
        foreach (var cv in cvs)
        {
            var skillIds = cv.KyNangs.Where(x => x.KyNangId.HasValue)
                .Select(x => x.KyNangId!.Value).ToHashSet();
            var skillNames = cv.KyNangs.Select(x => Norm(x.TenKyNang))
                .Where(x => x.Length > 0).ToHashSet();
            var matched = new List<string>();
            var missing = new List<string>();
            float totalWeight = 0f, matchedWeight = 0f;

            foreach (var requirement in requirements)
            {
                var weight = MucDoWeights.GetValueOrDefault(requirement.MucDoYeuCau, 1f);
                totalWeight += weight;
                var name = Norm(requirement.KyNang!.TenKyNang);
                if (skillIds.Contains(requirement.KyNangId) || skillNames.Contains(name))
                {
                    matchedWeight += weight;
                    matched.Add(requirement.KyNang!.TenKyNang.Trim());
                }
                else
                {
                    missing.Add(requirement.KyNang!.TenKyNang.Trim());
                }
            }

            var score = totalWeight > 0f ? matchedWeight / totalWeight : 0f;
            var position = Norm(cv.ThongTinLienHe?.ViTriUngTuyen ?? cv.HoSoUngVien.ViTriUngTuyen);
            var title = Norm(job.TieuDe);
            if (position.Length >= 3 && (title.Contains(position) || position.Contains(title))) score += 0.10f;

            var desiredSalary = cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)cv.HoSoUngVien.MucLuongMongMuon;
            if (desiredSalary > 0 && job.LuongToiDa >= desiredSalary &&
                (job.LuongToiThieu <= desiredSalary || job.LuongToiThieu == 0)) score += 0.05f;

            var address = Norm(cv.ThongTinLienHe?.DiaChi ?? cv.HoSoUngVien.DiaChi);
            var location = Norm(job.DiaDiemLamViec);
            if (address.Length > 0 && location.Length > 0 &&
                (location.Contains(address) || address.Contains(location))) score += 0.05f;

            score = Math.Min(score, 1f);
            if (score <= 0f) continue;

            results.Add(new SuggestedCandidateViewModel
            {
                HoSoUngVienId = cv.HoSoUngVienId,
                CvUngVienId = cv.Id,
                HoTen = cv.ThongTinLienHe?.HoTen ?? cv.HoSoUngVien.HoTen ?? string.Empty,
                ViTriUngTuyen = cv.ThongTinLienHe?.ViTriUngTuyen ?? cv.HoSoUngVien.ViTriUngTuyen ?? string.Empty,
                DiemPhuHop = score,
                PhanLoai = score >= 0.66f ? "Cao" : score >= 0.33f ? "TrungBinh" : "Thap",
                KyNangThoa = matched,
                KyNangThieu = missing,
                SoNamKinhNghiem = (int)Math.Floor(cv.HoSoUngVien.KinhNghiemLamViecs
                    .Where(x => x.TuNgay.HasValue)
                    .Sum(x => ((x.DenNgay ?? now) - x.TuNgay!.Value).TotalDays) / 365d)
            });
        }

        var top = results.OrderByDescending(x => x.DiemPhuHop)
            .ThenBy(x => x.HoTen)
            .Take(Math.Clamp(request.TopN, 1, 20))
            .ToList();
        return new Response<List<SuggestedCandidateViewModel>>(top,
            top.Count == 0 ? "Chưa tìm thấy ứng viên phù hợp với tin tuyển dụng này." : $"Tìm thấy {top.Count} ứng viên phù hợp.");
    }
}
