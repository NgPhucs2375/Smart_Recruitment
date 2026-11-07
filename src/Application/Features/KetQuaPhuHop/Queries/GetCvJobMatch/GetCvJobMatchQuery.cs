using Application.Features.KetQuaPhuHop.Matching;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Queries.GetCvJobMatch;

/// <summary>
/// Chấm đúng một cặp (CV, tin) bằng scorer tất định của luồng gợi ý việc,
/// không rerank và không ghi KetQuaPhuHop — luồng đọc phải giữ nguyên.
/// </summary>
public sealed record GetCvJobMatchQuery(int CvUngVienId, int TinTuyenDungId)
    : IRequest<Response<CvJobMatchViewModel>>;

public sealed class CvJobMatchViewModel
{
    public int CvUngVienId { get; set; }
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TenDoanhNghiep { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    /// <summary>Điểm khớp 0..1 do ContentBasedMatcher tính.</summary>
    public float DiemPhuHop { get; set; }
    public string PhanLoai { get; set; } = string.Empty;
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    public List<string> KyNangBatBuocThieu { get; set; } = new();
    public bool MeetsMandatory { get; set; }
    public string MatchingVersion { get; set; } = ContentBasedMatcher.Version;
}

public sealed class GetCvJobMatchQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<GetCvJobMatchQuery, Response<CvJobMatchViewModel>>
{
    public async Task<Response<CvJobMatchViewModel>> Handle(
        GetCvJobMatchQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var hoSo = await context.HoSoUngViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.NguoiDungId == currentUser.Id, cancellationToken);
        if (hoSo == null)
            return new Response<CvJobMatchViewModel>("Bạn chưa có hồ sơ ứng viên.");

        var cv = await context.CVUngViens.AsNoTracking()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.KyNangs)
            .FirstOrDefaultAsync(x => x.Id == request.CvUngVienId &&
                                      x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa,
                cancellationToken);
        if (cv == null)
            return new Response<CvJobMatchViewModel>("Không tìm thấy CV của bạn.");

        var job = await context.TinTuyenDungs.AsNoTracking()
            .Where(t => t.Id == request.TinTuyenDungId)
            .Select(t => new JobMatchPosting
            {
                Id = t.Id,
                TieuDe = t.TieuDe,
                TenDoanhNghiep = t.DoanhNghiep != null ? t.DoanhNghiep.TenDoanhNghiep : string.Empty,
                DiaDiemLamViec = t.DiaDiemLamViec,
                LuongToiThieu = t.LuongToiThieu,
                LuongToiDa = t.LuongToiDa,
                KinhNghiemYeuCau = t.KinhNghiemYeuCau,
                Skills = t.KyNangTinTuyenDungs
                    .Where(k => k.DanhMucKyNang != null)
                    .Select(k => new JobMatchSkill
                    {
                        KyNangId = k.KyNangId,
                        TenKyNang = k.DanhMucKyNang!.TenKyNang,
                        MucDoYeuCau = k.MucDoYeuCau,
                    })
                    .ToList(),
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (job == null)
            return new Response<CvJobMatchViewModel>("Không tìm thấy tin tuyển dụng.");

        var candidate = new CandidateMatchInput(
            cv.KyNangs.Select(k => new MatchSkill(
                k.KyNangId, k.TenKyNang, k.MucDoThanhThao, k.SoNamKinhNghiem)).ToList(),
            !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.ViTriUngTuyen)
                ? cv.ThongTinLienHe.ViTriUngTuyen : hoSo.ViTriUngTuyen,
            cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)hoSo.MucLuongMongMuon,
            !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.DiaChi)
                ? cv.ThongTinLienHe.DiaChi : hoSo.DiaChi);

        var corpus = await SkillCorpusLoader.LoadAsync(context, DateTime.UtcNow, cancellationToken);
        var match = ContentBasedMatcher.Evaluate(candidate, new JobMatchInput(
            job.Skills.Select(k => new MatchRequirement(k.KyNangId, k.TenKyNang, k.MucDoYeuCau)).ToList(),
            job.TieuDe, job.LuongToiThieu, job.LuongToiDa, job.DiaDiemLamViec, job.KinhNghiemYeuCau), corpus);

        return new Response<CvJobMatchViewModel>(new CvJobMatchViewModel
        {
            CvUngVienId = cv.Id,
            TinTuyenDungId = job.Id,
            TieuDe = job.TieuDe,
            TenDoanhNghiep = job.TenDoanhNghiep,
            DiaDiemLamViec = job.DiaDiemLamViec ?? string.Empty,
            DiemPhuHop = match.Score,
            PhanLoai = ContentBasedMatcher.PhanLoaiCua(match.Score).ToString(),
            KyNangThoa = match.MatchedSkills.ToList(),
            KyNangThieu = match.MissingSkills.ToList(),
            KyNangBatBuocThieu = match.MissingMandatory.ToList(),
            MeetsMandatory = match.MeetsMandatory,
        });
    }

    private sealed class JobMatchPosting
    {
        public int Id { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string TenDoanhNghiep { get; set; } = string.Empty;
        public string? DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public string? KinhNghiemYeuCau { get; set; }
        public List<JobMatchSkill> Skills { get; set; } = new();
    }

    private sealed class JobMatchSkill
    {
        public int KyNangId { get; set; }
        public string TenKyNang { get; set; } = string.Empty;
        public MucDoYC MucDoYeuCau { get; set; }
    }
}
