using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;

// Content-based matching v1 ("cbf-v1"): chấm điểm tin đang tuyển theo mức trùng
// kỹ năng (trọng số theo MucDoYC) + bonus vị trí/lương/địa điểm, rồi persist vào
// bảng KetQuaPhuHop để trang /viec-lam/phu-hop và agent dùng chung kết quả.
public class GetSuggestedJobsForCvQuery : IRequest<Response<List<SuggestedJobViewModel>>>
{
    /// <summary>Bỏ trống để dùng CV mặc định (IsDefault) của ứng viên hiện tại.</summary>
    public int? CvUngVienId { get; set; }

    /// <summary>Số tin trả về sau khi sắp xếp theo điểm giảm dần.</summary>
    public int TopN { get; set; } = 10;
}

public class SuggestedJobViewModel
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TenDoanhNghiep { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public float DiemPhuHop { get; set; }
    public string PhanLoai { get; set; } = string.Empty;
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    public DateTime? NgayHetHan { get; set; }
}

public class GetSuggestedJobsForCvQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    ILogger<GetSuggestedJobsForCvQueryHandler> logger)
    : IRequestHandler<GetSuggestedJobsForCvQuery, Response<List<SuggestedJobViewModel>>>
{
    private static readonly Dictionary<MucDoYC, float> MucDoWeights = new()
    {
        [MucDoYC.BatBuc] = 3f,
        [MucDoYC.UuTien] = 2f,
        [MucDoYC.KhongBatBuoc] = 1f,
    };

    private static string Norm(string? value) =>
        (value ?? string.Empty).Trim().ToLowerInvariant();

    public async Task<Response<List<SuggestedJobViewModel>>> Handle(
        GetSuggestedJobsForCvQuery request,
        CancellationToken cancellationToken)
    {
        var timer = Stopwatch.StartNew();
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var hoSo = await context.HoSoUngViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.NguoiDungId == currentUser.Id, cancellationToken);
        if (hoSo == null)
            return new Response<List<SuggestedJobViewModel>>("Bạn chưa có hồ sơ ứng viên.");

        var cv = request.CvUngVienId.HasValue
            ? await context.CVUngViens.AsNoTracking()
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.KyNangs)
                .FirstOrDefaultAsync(x => x.Id == request.CvUngVienId.Value &&
                                          x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa,
                    cancellationToken)
            : await context.CVUngViens.AsNoTracking()
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.KyNangs)
                .FirstOrDefaultAsync(x => x.HoSoUngVienId == hoSo.Id &&
                                          x.IsDefault && !x.IsDaXoa, cancellationToken);

        if (cv == null)
            return new Response<List<SuggestedJobViewModel>>(
                "Không tìm thấy CV phù hợp. Hãy tạo hoặc chọn một CV mặc định trước.");

        var skillIds = cv.KyNangs
            .Where(k => k.KyNangId.HasValue)
            .Select(k => k.KyNangId!.Value)
            .ToHashSet();
        var skillNames = cv.KyNangs
            .Select(k => Norm(k.TenKyNang))
            .Where(n => n.Length > 0)
            .ToHashSet();

        var viTri = Norm(cv.ThongTinLienHe?.ViTriUngTuyen) is { Length: > 0 } v
            ? v
            : Norm(hoSo.ViTriUngTuyen);
        var mucLuong = hoSo.MucLuongMongMuon;
        var diaChi = Norm(hoSo.DiaChi);

        var now = DateTime.UtcNow;
        var postings = await context.TinTuyenDungs.AsNoTracking()
            .Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (t.NgayHetHan == null || t.NgayHetHan > now))
            .Select(t => new JobMatchPosting
            {
                Id = t.Id,
                TieuDe = t.TieuDe,
                TenDoanhNghiep = t.DoanhNghiep != null ? t.DoanhNghiep.TenDoanhNghiep : string.Empty,
                DiaDiemLamViec = t.DiaDiemLamViec,
                LuongToiThieu = t.LuongToiThieu,
                LuongToiDa = t.LuongToiDa,
                NgayHetHan = t.NgayHetHan,
                Skills = t.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => new JobMatchSkill
                    {
                        KyNangId = k.KyNangId,
                        TenKyNang = k.KyNang!.TenKyNang,
                        MucDoYeuCau = k.MucDoYeuCau,
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("Job recommendation query loaded {PostingCount} postings in {ElapsedMs} ms.",
            postings.Count, timer.ElapsedMilliseconds);

        var results = new List<(SuggestedJobViewModel Vm, float Diem, string Thoa, string Thieu)>();
        foreach (var t in postings)
        {
            var postingSkills = t.Skills
                .Where(k => !string.IsNullOrWhiteSpace(k.TenKyNang))
                .ToList();

            var matchedNames = new List<string>();
            var missingNames = new List<string>();
            float totalWeight = 0f, matchedWeight = 0f;
            foreach (var k in postingSkills)
            {
                var weight = MucDoWeights.GetValueOrDefault(k.MucDoYeuCau, 1f);
                totalWeight += weight;
                var name = Norm(k.TenKyNang);
                var hit = k.KyNangId.HasValue && skillIds.Contains(k.KyNangId.Value)
                    || skillNames.Contains(name);
                if (hit)
                {
                    matchedWeight += weight;
                    matchedNames.Add(k.TenKyNang!.Trim());
                }
                else
                {
                    missingNames.Add(k.TenKyNang!.Trim());
                }
            }

            var diem = totalWeight > 0f ? matchedWeight / totalWeight : 0f;

            var tieuDe = Norm(t.TieuDe);
            if (viTri.Length >= 3 && (tieuDe.Contains(viTri) || viTri.Contains(tieuDe)))
                diem += 0.10f;
            if (mucLuong > 0 && t.LuongToiDa >= (decimal)mucLuong &&
                (t.LuongToiThieu <= (decimal)mucLuong || t.LuongToiThieu == 0))
                diem += 0.05f;
            if (diaChi.Length > 0 && t.DiaDiemLamViec != null)
            {
                var diaDiem = Norm(t.DiaDiemLamViec);
                if (diaDiem.Length > 0 && (diaDiem.Contains(diaChi) || diaChi.Contains(diaDiem)))
                    diem += 0.05f;
            }

            diem = Math.Min(diem, 1f);
            if (diem <= 0f)
                continue;

            results.Add((ToVm(t, diem), diem,
                string.Join(", ", matchedNames), string.Join(", ", missingNames)));
        }

        var top = results
            .OrderByDescending(r => r.Diem)
            .ThenByDescending(r => r.Vm.TinTuyenDungId)
            .Take(Math.Max(1, request.TopN))
            .ToList();

        // Persist để trang /viec-lam/phu-hop và lần tra cứu sau dùng lại kết quả.
        var oldRows = await context.KetQuaPhuHops
            .Where(k => k.HoSoUngVienId == hoSo.Id && k.CVUngVienId == cv.Id)
            .ToListAsync(cancellationToken);
        context.KetQuaPhuHops.RemoveRange(oldRows);
        foreach (var r in top)
        {
            context.KetQuaPhuHops.Add(new Domain.Entities.KetQuaPhuHop
            {
                HoSoUngVienId = hoSo.Id,
                CVUngVienId = cv.Id,
                TinTuyenDungId = r.Vm.TinTuyenDungId,
                DiemPhuHop = r.Diem,
                KyNangThoa = r.Thoa,
                KyNangThieu = r.Thieu,
                PhanLoai = PhanLoaiOf(r.Diem),
                GhiChu = "Gợi ý content-based: kỹ năng trùng + vị trí/lương/địa điểm.",
                MatchingVersion = "cbf-v1",
                ExplanationModel = "skill-overlap-weighted",
                EvaluateAt = DateTime.UtcNow,
                Created = DateTime.UtcNow,
            });
        }
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Job recommendation completed in {ElapsedMs} ms. Results={ResultCount}.",
            timer.ElapsedMilliseconds, top.Count);

        var message = top.Count == 0
            ? "Chưa có tin tuyển dụng nào phù hợp với CV này (kiểm tra lại kỹ năng đã điền trong CV)."
            : $"Tìm thấy {top.Count} tin tuyển dụng phù hợp.";
        return new Response<List<SuggestedJobViewModel>>(
            top.Select(r => r.Vm).ToList(), message);
    }

    private static SuggestedJobViewModel ToVm(JobMatchPosting t, float diem) => new()
    {
        TinTuyenDungId = t.Id,
        TieuDe = t.TieuDe,
        TenDoanhNghiep = t.TenDoanhNghiep,
        DiaDiemLamViec = t.DiaDiemLamViec ?? string.Empty,
        LuongToiThieu = t.LuongToiThieu,
        LuongToiDa = t.LuongToiDa,
        DiemPhuHop = diem,
        PhanLoai = PhanLoaiOf(diem).ToString(),
        NgayHetHan = t.NgayHetHan,
    };

    private sealed class JobMatchPosting
    {
        public int Id { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string TenDoanhNghiep { get; set; } = string.Empty;
        public string? DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public DateTime? NgayHetHan { get; set; }
        public List<JobMatchSkill> Skills { get; set; } = [];
    }

    private sealed class JobMatchSkill
    {
        public int? KyNangId { get; set; }
        public string? TenKyNang { get; set; }
        public MucDoYC MucDoYeuCau { get; set; }
    }

    private static PhanLoaiKetQua PhanLoaiOf(float diem) =>
        diem >= 0.66f ? PhanLoaiKetQua.Cao
        : diem >= 0.33f ? PhanLoaiKetQua.TrungBinh
        : PhanLoaiKetQua.Thap;
}
