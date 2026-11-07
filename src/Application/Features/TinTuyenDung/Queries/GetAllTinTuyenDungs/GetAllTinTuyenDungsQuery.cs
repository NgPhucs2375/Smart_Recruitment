using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq.Expressions;
using System.Text;
using TinTuyenDungEntity = Domain.Entities.TinTuyenDung;

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
            t.KyNangTinTuyenDungs.Any(k => k.DanhMucKyNang.TenKyNang.ToLower().Contains(keyword)));
        var location = request.Location?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(location)) query = query.Where(BuildLocationFilter(location));
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
            KyNangs = t.KyNangTinTuyenDungs.Select(k => k.DanhMucKyNang.TenKyNang).ToList(), SoLuongUngVien = t.DonUngTuyens.Count,
            Created = t.Created, LastModified = t.LastModified ?? t.Created, NguoiDaiDienDaDuyet = t.NguoiDaiDienDaDuyet,
            VaiTroNguoiDang = t.NguoiDangTin.VaiTro.ToString(), KetQuaSangLoc = user.VaiTro == VaiTroNguoiDung.UNG_VIEN ? "" : t.KetQuaSangLoc,
            GhiChuKiemDuyet = user.VaiTro == VaiTroNguoiDung.UNG_VIEN ? "" : context.Notifications.Where(n => n.ReferenceType == "TinTuyenDung" && n.ReferenceId == t.Id).OrderByDescending(n => n.Id).Select(n => n.NoiDung).FirstOrDefault() ?? "",
            KyNangYeuCaus = t.KyNangTinTuyenDungs.Select(k => new JobSkillViewModel { KyNangId = k.KyNangId, TenKyNang = k.DanhMucKyNang.TenKyNang, MucDoYeuCau = (int)k.MucDoYeuCau }).ToList(),
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

    private static Expression<Func<TinTuyenDungEntity, bool>> BuildLocationFilter(string location)
    {
        var name = location.Trim().ToLowerInvariant();
        var baseName = name.StartsWith("thành phố ", StringComparison.Ordinal)
            ? name["thành phố ".Length..]
            : name.StartsWith("tỉnh ", StringComparison.Ordinal) ? name["tỉnh ".Length..] : name;
        var terms = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { name, baseName, ToAscii(name), ToAscii(baseName) };
        foreach (var alias in baseName switch
        {
            "hà nội" => new[] { "ha noi", "hanoi" },
            "hồ chí minh" => new[] { "hcm", "tp hcm", "tphcm", "tp. hcm", "tp ho chi minh", "tp. hồ chí minh", "ho chi minh city", "sài gòn", "sai gon", "bình dương", "binh duong", "bà rịa", "ba ria", "vũng tàu", "vung tau" },
            "đà nẵng" => new[] { "da nang", "quảng nam", "quang nam" },
            "hải phòng" => new[] { "hai phong", "hải dương", "hai duong" },
            "cần thơ" => new[] { "can tho", "sóc trăng", "soc trang", "hậu giang", "hau giang" },
            "đồng nai" => new[] { "dong nai", "bình phước", "binh phuoc" },
            "quảng ninh" => new[] { "quang ninh" },
            "bắc ninh" => new[] { "bac ninh", "bắc giang", "bac giang" },
            "huế" => new[] { "hue", "thừa thiên huế", "thua thien hue" },
            "tuyên quang" => new[] { "tuyen quang", "hà giang", "ha giang" },
            "lào cai" => new[] { "lao cai", "yên bái", "yen bai" },
            "thái nguyên" => new[] { "thai nguyen", "bắc kạn", "bac kan", "backan" },
            "phú thọ" => new[] { "phu tho", "vĩnh phúc", "vinh phuc" },
            "hưng yên" => new[] { "hung yen", "thái bình", "thai binh" },
            "ninh bình" => new[] { "ninh binh", "nam định", "nam dinh", "hà nam", "ha nam" },
            "quảng trị" => new[] { "quang tri", "quảng bình", "quang binh" },
            "quảng ngãi" => new[] { "quang ngai", "kon tum", "kontum" },
            "gia lai" => new[] { "gia lai", "bình định", "binh dinh" },
            "khánh hòa" => new[] { "khanh hoa", "ninh thuận", "ninh thuan" },
            "đắk lắk" => new[] { "dak lak", "phú yên", "phu yen" },
            "lâm đồng" => new[] { "lam dong", "đắk nông", "dak nong", "bình thuận", "binh thuan" },
            "tây ninh" => new[] { "tay ninh", "long an" },
            "đồng tháp" => new[] { "dong thap", "tiền giang", "tien giang" },
            "vĩnh long" => new[] { "vinh long", "trà vinh", "tra vinh", "bến tre", "ben tre" },
            "an giang" => new[] { "an giang", "kiên giang", "kien giang" },
            "cà mau" => new[] { "ca mau", "bạc liêu", "bac lieu" },
            _ => Array.Empty<string>()
        }) terms.Add(alias);

        var parameter = Expression.Parameter(typeof(TinTuyenDungEntity), "job");
        var locationProperty = Expression.Property(parameter, nameof(TinTuyenDungEntity.DiaDiemLamViec));
        var loweredLocation = Expression.Call(locationProperty, typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!);
        var contains = typeof(string).GetMethod(nameof(string.Contains), [typeof(string)])!;
        Expression body = Expression.Constant(false);
        foreach (var term in terms.Where(term => !string.IsNullOrWhiteSpace(term)))
        {
            var match = Expression.Call(loweredLocation, contains, Expression.Constant(term.ToLowerInvariant()));
            body = Expression.OrElse(body, match);
        }

        return Expression.Lambda<Func<TinTuyenDungEntity, bool>>(body, parameter);
    }

    private static string ToAscii(string value)
    {
        var decomposed = value.Normalize(NormalizationForm.FormD);
        return new string(decomposed
            .Where(character => CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            .Select(character => character == 'đ' ? 'd' : character == 'Đ' ? 'D' : character)
            .ToArray()).ToLowerInvariant();
    }
}
