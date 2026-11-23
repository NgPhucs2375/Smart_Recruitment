using Application.Features.KetQuaPhuHop.Matching;
using Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Queries.GetCandidateJobMatch;

/// <summary>
/// Chấm đúng một cặp (hồ sơ ứng viên, tin) cho nhân sự/người đại diện.
/// Dùng cùng scorer tất định với luồng gợi ý ứng viên nhưng không xếp hạng
/// toàn bộ pool và không rerank — phục vụ giải thích/so sánh một ứng viên cụ thể
/// mà không bị giới hạn trong top-N gợi ý.
/// CvUngVienId ưu tiên CV cụ thể (CV đã nộp); null = CV mặc định của hồ sơ.
/// </summary>
public sealed record GetCandidateJobMatchQuery(
    int TinTuyenDungId,
    int? HoSoUngVienId = null,
    int? CvUngVienId = null)
    : IRequest<Response<SuggestedCandidateViewModel>>;

public sealed class GetCandidateJobMatchQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<GetCandidateJobMatchQuery, Response<SuggestedCandidateViewModel>>
{
    public async Task<Response<SuggestedCandidateViewModel>> Handle(
        GetCandidateJobMatchQuery request,
        CancellationToken cancellationToken)
    {
        var current = await currentNguoiDungService.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Response<SuggestedCandidateViewModel>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Response<SuggestedCandidateViewModel>("Tài khoản chưa thuộc doanh nghiệp nào.");
        if (request.HoSoUngVienId is null && request.CvUngVienId is null)
            return new Response<SuggestedCandidateViewModel>("Cần chỉ định hồ sơ hoặc CV ứng viên.");

        var job = await context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.DanhMucKyNang)
            .FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId &&
                                      x.DoanhNghiepId == current.DoanhNghiepId.Value,
                cancellationToken);
        if (job == null)
            return new Response<SuggestedCandidateViewModel>("Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.");

        var cv = await context.CVUngViens.AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.KyNangs)
            .Include(x => x.KinhNghiems)
            .Include(x => x.DuAns)
            .Include(x => x.HoSoUngVien)
                .ThenInclude(x => x.KinhNghiemLamViecs)
            .FirstOrDefaultAsync(x => !x.IsDaXoa &&
                                      (request.CvUngVienId.HasValue
                                          ? x.Id == request.CvUngVienId.Value
                                          : x.HoSoUngVienId == request.HoSoUngVienId && x.IsDefault) &&
                                      (!request.HoSoUngVienId.HasValue || x.HoSoUngVienId == request.HoSoUngVienId.Value),
                cancellationToken);
        if (cv == null)
            return new Response<SuggestedCandidateViewModel>(request.CvUngVienId.HasValue
                ? "Không tìm thấy CV ứng viên để chấm điểm."
                : "Ứng viên chưa có CV mặc định để chấm điểm.");

        var requirements = job.KyNangTinTuyenDungs
            .Where(x => x.DanhMucKyNang != null && !string.IsNullOrWhiteSpace(x.DanhMucKyNang.TenKyNang))
            .Select(x => new MatchRequirement(x.KyNangId, x.DanhMucKyNang!.TenKyNang, x.MucDoYeuCau))
            .ToList();
        var now = DateTime.UtcNow;
        var corpus = await SkillCorpusLoader.LoadAsync(context, now, cancellationToken);
        var match = ContentBasedMatcher.Evaluate(
            new CandidateMatchInput(
                cv.KyNangs.Select(x => new MatchSkill(x.KyNangId, x.TenKyNang, x.MucDoThanhThao, x.SoNamKinhNghiem)).ToList(),
                !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.ViTriUngTuyen)
                    ? cv.ThongTinLienHe.ViTriUngTuyen : cv.HoSoUngVien.ViTriUngTuyen,
                cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)cv.HoSoUngVien.MucLuongMongMuon,
                !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.DiaChi)
                    ? cv.ThongTinLienHe.DiaChi : cv.HoSoUngVien.DiaChi,
                CandidateEvidenceText.From(cv)),
            new JobMatchInput(requirements, job.TieuDe,
                job.LuongToiThieu, job.LuongToiDa, job.DiaDiemLamViec, job.KinhNghiemYeuCau),
            corpus);

        return new Response<SuggestedCandidateViewModel>(new SuggestedCandidateViewModel
        {
            HoSoUngVienId = cv.HoSoUngVienId,
            CvUngVienId = cv.Id,
            HoTen = cv.ThongTinLienHe?.HoTen ?? cv.HoSoUngVien.HoTen ?? string.Empty,
            ViTriUngTuyen = cv.ThongTinLienHe?.ViTriUngTuyen ?? cv.HoSoUngVien.ViTriUngTuyen ?? string.Empty,
            DiemPhuHop = match.Score,
            PhanLoai = ContentBasedMatcher.PhanLoaiCua(match.Score).ToString(),
            KyNangThoa = match.MatchedSkills.ToList(),
            KyNangThieu = match.MissingSkills.ToList(),
            KyNangBatBuocThieu = match.MissingMandatory.ToList(),
            SoNamKinhNghiem = (int)Math.Floor(cv.HoSoUngVien.KinhNghiemLamViecs
                .Where(x => x.TuNgay.HasValue)
                .Sum(x => ((x.DenNgay ?? now) - x.TuNgay!.Value).TotalDays) / 365d)
        });
    }
}
