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
/// CvUngVienId null = dùng CV mặc định của ứng viên hiện tại.
/// </summary>
public sealed record GetCvJobMatchQuery(int? CvUngVienId, int TinTuyenDungId)
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
    /// <summary>Điểm thành phần kỹ năng 0..1 (đã gồm trọng số MucDoYC, IDF và trình độ).</summary>
    public float DiemKyNang { get; set; }
    public float BonusViTri { get; set; }
    public float BonusLuong { get; set; }
    public float BonusDiaDiem { get; set; }
    /// <summary>Có thể âm: thiếu số năm yêu cầu bị trừ tối đa 0.05.</summary>
    public float BonusKinhNghiem { get; set; }
    /// <summary>Số điểm đã bị hạ vì thiếu kỹ năng bắt buộc (trần 0.60, trừ 0.05 mỗi kỹ năng).</summary>
    public float PhatBatBuoc { get; set; }
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    public List<string> KyNangBatBuocThieu { get; set; } = new();
    public bool MeetsMandatory { get; set; }
    /// <summary>
    /// Bốn ưu đãi phụ kèm trạng thái thật, để UI phân biệt "không khớp" với
    /// "không áp dụng" / "CV chưa khai" thay vì hiển thị 0% như một tiêu chí trượt.
    /// TrangThai: dat | khongKhop | biTru | thieuDuLieu | khongApDung.
    /// </summary>
    public List<MatchComponentVm> ThanhPhan { get; set; } = new();
    public string MatchingVersion { get; set; } = ContentBasedMatcher.Version;
}

public sealed class MatchComponentVm
{
    public string Key { get; set; } = string.Empty;
    public string Nhan { get; set; } = string.Empty;
    public float Diem { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public string GhiChu { get; set; } = string.Empty;
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

        var cv = request.CvUngVienId.HasValue
            ? await context.CVUngViens.AsNoTracking()
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.KyNangs)
                .Include(x => x.KinhNghiems)
                .Include(x => x.DuAns)
                .FirstOrDefaultAsync(x => x.Id == request.CvUngVienId.Value &&
                                          x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa,
                    cancellationToken)
            : await context.CVUngViens.AsNoTracking()
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.KyNangs)
                .Include(x => x.KinhNghiems)
                .Include(x => x.DuAns)
                .FirstOrDefaultAsync(x => x.HoSoUngVienId == hoSo.Id &&
                                          x.IsDefault && !x.IsDaXoa, cancellationToken);
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
                ? cv.ThongTinLienHe.DiaChi : hoSo.DiaChi,
            CandidateEvidenceText.From(cv));

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
            DiemKyNang = match.SkillScore,
            BonusViTri = match.PositionBonus,
            BonusLuong = match.SalaryBonus,
            BonusDiaDiem = match.LocationBonus,
            BonusKinhNghiem = match.ExperienceBonus,
            PhatBatBuoc = match.MandatoryPenalty,
            KyNangThoa = match.MatchedSkills.ToList(),
            KyNangThieu = match.MissingSkills.ToList(),
            KyNangBatBuocThieu = match.MissingMandatory.ToList(),
            MeetsMandatory = match.MeetsMandatory,
            ThanhPhan = BuildComponents(match, candidate, job),
        });
    }

    /// <summary>
    /// Mô tả từng ưu đãi phụ bằng dữ liệu thật của hai bên: 0 điểm chỉ được gọi là
    /// "không khớp" khi cả hai bên đều có dữ liệu so sánh; còn lại là "không áp dụng"
    /// hoặc "CV/tin chưa khai".
    /// </summary>
    private static List<MatchComponentVm> BuildComponents(
        ContentMatchResult match, CandidateMatchInput candidate, JobMatchPosting job)
    {
        static string So(float value) => value.ToString("0.#");

        var components = new List<MatchComponentVm>
        {
            new()
            {
                Key = "viTri",
                Nhan = "Vị trí",
                Diem = match.PositionBonus,
                TrangThai = string.IsNullOrWhiteSpace(candidate.Position) ? "thieuDuLieu"
                    : string.IsNullOrWhiteSpace(job.TieuDe) ? "khongApDung"
                    : match.PositionBonus > 0 ? "dat" : "khongKhop",
                GhiChu = string.IsNullOrWhiteSpace(candidate.Position)
                    ? "CV chưa khai vị trí ứng tuyển."
                    : string.IsNullOrWhiteSpace(job.TieuDe) ? "Tin không có tiêu đề để so khớp."
                    : match.PositionBonus > 0 ? "Tên tin trùng vị trí ứng tuyển trong CV."
                    : "Vị trí trong CV không trùng tên tin nên không có ưu đãi.",
            },
            new()
            {
                Key = "luong",
                Nhan = "Lương",
                Diem = match.SalaryBonus,
                TrangThai = job.LuongToiDa <= 0 ? "khongApDung"
                    : candidate.DesiredSalary <= 0 ? "thieuDuLieu"
                    : match.SalaryBonus > 0 ? "dat" : "khongKhop",
                GhiChu = job.LuongToiDa <= 0 ? "Tin không công bố dải lương."
                    : candidate.DesiredSalary <= 0 ? "CV chưa khai mức lương mong muốn."
                    : match.SalaryBonus > 0 ? "Mức lương mong muốn nằm trong dải của tin."
                    : "Mức lương mong muốn nằm ngoài dải của tin.",
            },
            new()
            {
                Key = "diaDiem",
                Nhan = "Địa điểm",
                Diem = match.LocationBonus,
                TrangThai = string.IsNullOrWhiteSpace(job.DiaDiemLamViec) ? "khongApDung"
                    : string.IsNullOrWhiteSpace(candidate.Address) ? "thieuDuLieu"
                    : match.LocationBonus > 0 ? "dat" : "khongKhop",
                GhiChu = string.IsNullOrWhiteSpace(job.DiaDiemLamViec) ? "Tin không ghi địa điểm làm việc."
                    : string.IsNullOrWhiteSpace(candidate.Address) ? "CV chưa khai địa chỉ."
                    : match.LocationBonus >= .05f ? "Cùng quận/huyện và tỉnh/thành với tin."
                    : match.LocationBonus > 0 ? "Cùng tỉnh/thành, khác quận/huyện."
                    : "Khác tỉnh/thành với nơi làm việc của tin.",
            },
            new()
            {
                Key = "kinhNghiem",
                Nhan = "Kinh nghiệm",
                Diem = match.ExperienceBonus,
                TrangThai = match.JobRequiredYears is null or <= 0 ? "khongApDung"
                    : match.CandidateYears is null ? "thieuDuLieu"
                    : match.ExperienceBonus > 0 ? "dat"
                    : match.ExperienceBonus < 0 ? "biTru" : "khongKhop",
                GhiChu = match.JobRequiredYears is null ? "Tin không ghi số năm kinh nghiệm."
                    : match.JobRequiredYears <= 0 ? "Tin không yêu cầu kinh nghiệm."
                    : match.CandidateYears is null ? "CV chưa khai số năm cho kỹ năng nào."
                    : match.ExperienceBonus > 0
                        ? $"CV có {So(match.CandidateYears.Value)} năm, đáp ứng mức {So(match.JobRequiredYears.Value)} năm."
                    : match.ExperienceBonus < 0
                        ? $"CV có {So(match.CandidateYears.Value)} năm, thiếu so với {So(match.JobRequiredYears.Value)} năm yêu cầu."
                    : $"CV có {So(match.CandidateYears.Value)} năm, chưa đạt nửa mức {So(match.JobRequiredYears.Value)} năm nên chưa có ưu đãi.",
            },
        };
        return components;
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
