using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;

public class GetAllTinTuyenDungsQuery : IRequest<PagedResponse<List<GetAllTinTuyenDungsViewModel>>>
{
    public int _start { get; set; }
    public int _end { get; set; }
    public string _order { get; set; }
    public string _sort { get; set; }
    public string _filter { get; set; }
    public string Location { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string Level { get; set; }
    public string EmploymentType { get; set; }
    public string WorkMode { get; set; }
    public int? DoanhNghiepId { get; set; }
    public TrangThaiTinTuyenDung? TrangThai { get; set; }
    public int? DanhMucNgheId { get; set; }
    public List<int> KyNangIds { get; set; } = new();
    public bool MatchAllSkills { get; set; }
}

public class GetAllTinTuyenDungsQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
    : IRequestHandler<GetAllTinTuyenDungsQuery, PagedResponse<List<GetAllTinTuyenDungsViewModel>>>
{
    public async Task<PagedResponse<List<GetAllTinTuyenDungsViewModel>>> Handle(GetAllTinTuyenDungsQuery request, CancellationToken ct)
    {
        var user = await current.ResolveAsync();
        var skills = request.KyNangIds.Distinct().ToList();
        if (skills.Count > 20 || skills.Any(x => x <= 0)) throw new ApiException("Chọn tối đa 20 kỹ năng hợp lệ.");
        if (request.SalaryMin < 0 || request.SalaryMax < 0 ||
            (request.SalaryMin.HasValue && request.SalaryMax.HasValue && request.SalaryMin > request.SalaryMax))
            throw new ApiException("Khoảng lương không hợp lệ.");
        var query = context.TinTuyenDungs.AsNoTracking();
        if (user.VaiTro == VaiTroNguoiDung.NHAN_SU)
            query = query.Where(t => t.NguoiDangTinId == user.Id && t.DoanhNghiepId == user.DoanhNghiepId);
        else if (user.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            query = query.Where(t => t.DoanhNghiepId == user.DoanhNghiepId);
        else if (user.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            query = query.Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen && (t.NgayHetHan == null || t.NgayHetHan > DateTime.UtcNow));
        if (request.TrangThai.HasValue) query = query.Where(t => t.TrangThai == request.TrangThai.Value);
        if (request.DoanhNghiepId.HasValue) query = query.Where(t => t.DoanhNghiepId == request.DoanhNghiepId.Value);
        if (request.DanhMucNgheId.HasValue) query = query.Where(t => t.DanhMucNgheId == request.DanhMucNgheId.Value);
        if (skills.Count > 0)
            query = request.MatchAllSkills
                ? query.Where(t => t.KyNangTinTuyenDungs.Where(k => skills.Contains(k.KyNangId)).Select(k => k.KyNangId).Distinct().Count() == skills.Count)
                : query.Where(t => t.KyNangTinTuyenDungs.Any(k => skills.Contains(k.KyNangId)));
        var keyword = request._filter?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(keyword)) query = query.Where(t =>
            t.TieuDe.ToLower().Contains(keyword) || t.MoTaCongViec.ToLower().Contains(keyword) ||
            t.YeuCauCongViec.ToLower().Contains(keyword) || t.DoanhNghiep.TenDoanhNghiep.ToLower().Contains(keyword) ||
            t.KyNangTinTuyenDungs.Any(k => k.KyNang.TenKyNang.ToLower().Contains(keyword)));
        var location = request.Location?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(location)) query = query.Where(t => t.DiaDiemLamViec.ToLower().Contains(location));
        if (request.SalaryMin.HasValue) query = query.Where(t => t.LuongToiDa >= request.SalaryMin.Value);
        if (request.SalaryMax.HasValue) query = query.Where(t => t.LuongToiThieu <= request.SalaryMax.Value);
        if (!string.IsNullOrWhiteSpace(request.WorkMode))
        {
            if (!Enum.TryParse<PhuongThucLamViec>(request.WorkMode, true, out var mode) || !Enum.IsDefined(mode))
                throw new ApiException("Phương thức làm việc không hợp lệ.");
            query = query.Where(t => t.PhuongThucLamViec == mode);
        }
        // Classification predicates remain in SQL, before counting and paging.
        var classified = query.Select(t => new { Row = t,
            Career = (t.TieuDe + " " + (t.KinhNghiemYeuCau ?? "")).ToLower(),
            Contract = ((t.YeuCauCongViec ?? "") + " " + (t.MoTaCongViec ?? "")).ToLower() })
            .Select(x => new { x.Row,
                Level = x.Career.Contains("intern") || x.Career.Contains("thực tập") ? "Intern" :
                    x.Career.Contains("fresher") || x.Career.Contains("mới tốt nghiệp") ? "Fresher" :
                    x.Career.Contains("junior") ? "Junior" : x.Career.Contains("lead") || x.Career.Contains("trưởng nhóm") ? "Lead" :
                    x.Career.Contains("manager") || x.Career.Contains("quản lý") ? "Manager" :
                    x.Career.Contains("senior") || x.Career.Contains("cao cấp") ? "Senior" : "Mid",
                Employment = x.Contract.Contains("part-time") || x.Contract.Contains("bán thời gian") || x.Contract.Contains("part time") ? "Part-time" :
                    x.Contract.Contains("freelance") || x.Contract.Contains("tự do") ? "Freelance" :
                    x.Contract.Contains("contract") || x.Contract.Contains("hợp đồng") ? "Contract" : "Full-time" });
        if (!string.IsNullOrWhiteSpace(request.Level))
        { var level = request.Level.ToLowerInvariant(); classified = classified.Where(x => x.Level.ToLower() == level); }
        if (!string.IsNullOrWhiteSpace(request.EmploymentType))
        { var employment = request.EmploymentType.ToLowerInvariant(); classified = classified.Where(x => x.Employment.ToLower() == employment); }
        query = classified.Select(x => x.Row);
        query = request._sort?.ToLowerInvariant() switch
        {
            "tieude" => request._order?.ToLowerInvariant() == "desc" ? query.OrderByDescending(t => t.TieuDe).ThenBy(t => t.Id) : query.OrderBy(t => t.TieuDe).ThenBy(t => t.Id),
            "luong" => request._order?.ToLowerInvariant() == "desc" ? query.OrderByDescending(t => t.LuongToiDa).ThenBy(t => t.Id) : query.OrderBy(t => t.LuongToiThieu).ThenBy(t => t.Id),
            "ngaytao" => request._order?.ToLowerInvariant() == "asc" ? query.OrderBy(t => t.Created).ThenBy(t => t.Id) : query.OrderByDescending(t => t.Created).ThenByDescending(t => t.Id),
            _ => query.OrderByDescending(t => t.Id)
        };
        var start = Math.Max(0, request._start);
        var size = Math.Clamp(request._end > start ? request._end - start : 20, 1, 100);
        var total = await query.CountAsync(ct);
        var rows = await query.Skip(start).Take(size).Select(t => new GetAllTinTuyenDungsViewModel
        {
            Id = t.Id, DanhMucNgheId = t.DanhMucNgheId, TieuDe = t.TieuDe, MoTaCongViec = t.MoTaCongViec,
            KinhNghiemYeuCau = t.KinhNghiemYeuCau, YeuCauCongViec = t.YeuCauCongViec, QuyenLoi = t.QuyenLoi,
            DiaDiemLamViec = t.DiaDiemLamViec, PhuongThucLamViec = t.PhuongThucLamViec.ToString(),
            LuongToiThieu = t.LuongToiThieu, LuongToiDa = t.LuongToiDa, TrangThai = t.TrangThai.ToString(), NgayHetHan = t.NgayHetHan,
            NguoiDangTinId = t.NguoiDangTinId, DoanhNghiepId = t.DoanhNghiepId, TenDoanhNghiep = t.DoanhNghiep.TenDoanhNghiep,
            KyNangs = t.KyNangTinTuyenDungs.Select(k => k.KyNang.TenKyNang).ToList(), SoLuongUngVien = t.DonUngTuyens.Count,
            Created = t.Created, LastModified = t.LastModified ?? t.Created, NguoiDaiDienDaDuyet = t.NguoiDaiDienDaDuyet,
            VaiTroNguoiDang = t.NguoiDangTin.VaiTro.ToString(), KetQuaSangLoc = user.VaiTro == VaiTroNguoiDung.UNG_VIEN ? "" : t.KetQuaSangLoc,
            GhiChuKiemDuyet = user.VaiTro == VaiTroNguoiDung.UNG_VIEN ? "" : context.Notifications.Where(n => n.ReferenceType == "TinTuyenDung" && n.ReferenceId == t.Id).OrderByDescending(n => n.Id).Select(n => n.NoiDung).FirstOrDefault() ?? "",
            KyNangYeuCaus = t.KyNangTinTuyenDungs.Select(k => new JobSkillViewModel { KyNangId = k.KyNangId, TenKyNang = k.KyNang.TenKyNang, MucDoYeuCau = (int)k.MucDoYeuCau }).ToList(),
            WorkMode = t.PhuongThucLamViec.ToString(), Level = InferLevel(t.TieuDe, t.KinhNghiemYeuCau), EmploymentType = InferEmploymentType(t.YeuCauCongViec, t.MoTaCongViec)
        }).ToListAsync(ct);
        return new PagedResponse<List<GetAllTinTuyenDungsViewModel>>(rows, start / size + 1, size, total, (int)Math.Ceiling(total / (double)size));
    }
    private static string InferLevel(string title, string experience)
    {
        var t = $"{title} {experience}".ToLowerInvariant();
        if (t.Contains("intern") || t.Contains("thực tập")) return "Intern";
        if (t.Contains("fresher") || t.Contains("mới tốt nghiệp")) return "Fresher";
        if (t.Contains("junior")) return "Junior";
        if (t.Contains("lead") || t.Contains("trưởng nhóm")) return "Lead";
        if (t.Contains("manager") || t.Contains("quản lý")) return "Manager";
        if (t.Contains("senior") || t.Contains("cao cấp")) return "Senior";
        return "Mid";
    }
    private static string InferEmploymentType(string requirements, string description)
    {
        var t = $"{requirements} {description}".ToLowerInvariant();
        if (t.Contains("part-time") || t.Contains("bán thời gian") || t.Contains("part time")) return "Part-time";
        if (t.Contains("freelance") || t.Contains("tự do")) return "Freelance";
        if (t.Contains("contract") || t.Contains("hợp đồng")) return "Contract";
        return "Full-time";
    }
}
