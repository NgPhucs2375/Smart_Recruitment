using System.ComponentModel;
using Application.Interfaces;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace WebApp.Server.Agent.RecommenAdam.Recruiter.Tools;

internal sealed class RecruiterTools
{
    private readonly ISender _sender;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentNguoiDungService _current;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RecruiterTools(
        ISender sender,
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        IHttpContextAccessor httpContextAccessor)
    {
        _sender = sender;
        _context = context;
        _current = current;
        _httpContextAccessor = httpContextAccessor;
    }

    [Description("Lấy top công việc đang tuyển phù hợp nhất với CV mặc định của ứng viên hiện tại. Kết quả gồm điểm phù hợp, kỹ năng khớp, kỹ năng thiếu, doanh nghiệp, địa điểm và lương. Luôn gọi tool này khi user hỏi việc phù hợp hoặc việc nên ứng tuyển.")]
    public Task<Application.Wrappers.Response<List<SuggestedJobViewModel>>> GetJobRecommendationsAsync(
        [Description("Số lượng công việc muốn lấy, từ 3 đến 10. Mặc định 10.")] int topN = 10,
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(new GetSuggestedJobsForCvQuery
        {
            TopN = Math.Clamp(topN, 3, 10),
        }, cancellationToken);
    }   

    [Description("Tìm top ứng viên phù hợp nhất cho đúng một tin tuyển dụng thuộc doanh nghiệp hiện tại. Chỉ dùng khi người dùng là nhân sự hoặc người đại diện và đã xác định TinTuyenDungId.")]
    public Task<Application.Wrappers.Response<List<SuggestedCandidateViewModel>>> GetCandidateRecommendationsForJobAsync(
        [Description("Id của đúng một tin tuyển dụng cần tìm ứng viên.")] int tinTuyenDungId,
        [Description("Số lượng ứng viên muốn lấy, từ 3 đến 20. Mặc định 10.")] int topN = 10,
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(new GetSuggestedCandidatesForJobQuery
        {
            TinTuyenDungId = tinTuyenDungId,
            TopN = Math.Clamp(topN, 3, 20),
        }, cancellationToken);
    }

    [Description("Lấy danh sách tin tuyển dụng của doanh nghiệp hiện tại để người dùng chọn đúng một tin trước khi tìm ứng viên.")]
    public async Task<Application.Wrappers.Response<List<RecruitmentJobOption>>> GetMyRecruitmentJobsAsync(
        CancellationToken cancellationToken = default)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Application.Wrappers.Response<List<RecruitmentJobOption>>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Application.Wrappers.Response<List<RecruitmentJobOption>>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var jobs = await _context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .Where(x => x.DoanhNghiepId == current.DoanhNghiepId.Value &&
                        x.TrangThai != TrangThaiTinTuyenDung.DaDong &&
                        x.TrangThai != TrangThaiTinTuyenDung.HetHan)
            .OrderByDescending(x => x.Created)
            .Take(50)
            .Select(x => new RecruitmentJobOption
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                TrangThai = x.TrangThai.ToString(),
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa,
                KyNang = x.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => k.KyNang!.TenKyNang)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return new Application.Wrappers.Response<List<RecruitmentJobOption>>(jobs);
    }

    [Description("Lấy context tuyển dụng hiện tại của nhân sự/người đại diện: màn hình đang mở và danh sách tin tuyển dụng thuộc doanh nghiệp. Dùng tool này khi người dùng nói 'tin đang đăng hiện tại', 'tin này' hoặc yêu cầu liệt kê tin để chọn một tin. Nếu chỉ có một tin đang đăng thì dùng ngay tin đó.")]
    public async Task<Application.Wrappers.Response<CurrentRecruitmentContext>> GetCurrentRecruitmentContextAsync(
        CancellationToken cancellationToken = default)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Application.Wrappers.Response<CurrentRecruitmentContext>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Application.Wrappers.Response<CurrentRecruitmentContext>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var jobs = await _context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .Where(x => x.DoanhNghiepId == current.DoanhNghiepId.Value &&
                        x.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (x.NgayHetHan == null || x.NgayHetHan > DateTime.UtcNow))
            .OrderByDescending(x => x.Created)
            .Take(50)
            .Select(x => new RecruitmentJobOption
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                TrangThai = x.TrangThai.ToString(),
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa,
                KyNang = x.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => k.KyNang!.TenKyNang)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return new Application.Wrappers.Response<CurrentRecruitmentContext>(new CurrentRecruitmentContext
        {
            Route = _httpContextAccessor.HttpContext?.Request.Headers["X-Adam-Route"].ToString() ?? string.Empty,
            DangTuyenJobs = jobs
        });
    }

    [Description("Lấy thông tin chi tiết của đúng một tin tuyển dụng thuộc doanh nghiệp hiện tại. Dùng khi người dùng muốn xem hoặc hỏi chi tiết một tin.")]
    public async Task<Application.Wrappers.Response<RecruitmentJobDetail>> GetRecruitmentJobDetailAsync(
        [Description("Id của một tin tuyển dụng cần xem chi tiết.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Application.Wrappers.Response<RecruitmentJobDetail>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Application.Wrappers.Response<RecruitmentJobDetail>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var job = await _context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .Where(x => x.Id == tinTuyenDungId && x.DoanhNghiepId == current.DoanhNghiepId.Value)
            .Select(x => new RecruitmentJobDetail
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                MoTaCongViec = x.MoTaCongViec,
                KinhNghiemYeuCau = x.KinhNghiemYeuCau,
                YeuCauCongViec = x.YeuCauCongViec,
                QuyenLoi = x.QuyenLoi,
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa,
                TrangThai = x.TrangThai.ToString(),
                NgayHetHan = x.NgayHetHan,
                KyNang = x.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => k.KyNang!.TenKyNang)
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return job == null
            ? new Application.Wrappers.Response<RecruitmentJobDetail>("Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.")
            : new Application.Wrappers.Response<RecruitmentJobDetail>(job);
    }
}

public sealed class RecruitmentJobOption
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class CurrentRecruitmentContext
{
    public string Route { get; set; } = string.Empty;
    public List<RecruitmentJobOption> DangTuyenJobs { get; set; } = new();
}

public sealed class RecruitmentJobDetail
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTaCongViec { get; set; } = string.Empty;
    public string KinhNghiemYeuCau { get; set; } = string.Empty;
    public string YeuCauCongViec { get; set; } = string.Empty;
    public string QuyenLoi { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime? NgayHetHan { get; set; }
    public List<string> KyNang { get; set; } = new();
}
