#nullable enable
using Application.Exceptions;
using Application.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Application.Services.StateMachineTinTuyenDung;

public class JobSkillInput
{
    public int KyNangId { get; set; }
    public MucDoYC MucDoYeuCau { get; set; }
}

public class JobDraftInput
{
    public int DanhMucNgheId { get; set; }
    public string TieuDe { get; set; } = "";
    public string MoTaCongViec { get; set; } = "";
    public string KinhNghiemYeuCau { get; set; } = "";
    public string YeuCauCongViec { get; set; } = "";
    public string QuyenLoi { get; set; } = "";
    public string DiaDiemLamViec { get; set; } = "";
    public PhuongThucLamViec PhuongThucLamViec { get; set; }
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public DateTime? NgayHetHan { get; set; }
    // Null preserves skills for older clients; an empty list explicitly clears them.
    public List<JobSkillInput>? KyNangs { get; set; }
    public DateTime? ExpectedLastModified { get; set; }
}

public class JobDraftValidator<T> : AbstractValidator<T> where T : JobDraftInput
{
    public JobDraftValidator()
    {
        RuleFor(x => x.DanhMucNgheId).GreaterThan(0);
        RuleFor(x => x.TieuDe).NotEmpty().MaximumLength(255);
        RuleFor(x => x.DiaDiemLamViec).MaximumLength(255);
        RuleFor(x => x.KinhNghiemYeuCau).MaximumLength(2000);
        RuleFor(x => x.QuyenLoi).MaximumLength(2000);
        RuleFor(x => x.PhuongThucLamViec).IsInEnum();
        RuleFor(x => x.LuongToiThieu).GreaterThanOrEqualTo(0);
        RuleFor(x => x.LuongToiDa).GreaterThanOrEqualTo(x => x.LuongToiThieu);
        RuleForEach(x => x.KyNangs).ChildRules(skill =>
        {
            skill.RuleFor(x => x.KyNangId).GreaterThan(0);
            skill.RuleFor(x => x.MucDoYeuCau).IsInEnum();
        });
        RuleFor(x => x.KyNangs).Must(skills => skills == null ||
            skills.Select(x => x.KyNangId).Distinct().Count() == skills.Count)
            .WithMessage("Không được chọn kỹ năng trùng lặp.");
    }
}

public static class JobDraft
{
    public static bool CanEdit(CurrentNguoiDungContext user, TinTuyenDung job) =>
        user.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN && user.DoanhNghiepId == job.DoanhNghiepId ||
        user.VaiTro == VaiTroNguoiDung.NHAN_SU && user.Id == job.NguoiDangTinId && user.DoanhNghiepId == job.DoanhNghiepId;

    public static void EnsureVersion(TinTuyenDung job, DateTime? expected)
    {
        if (expected.HasValue && (job.LastModified ?? job.Created) != expected)
            throw new ApiException("Tin đã được thay đổi. Vui lòng tải lại trước khi thao tác.", 409);
    }

    public static void EnsurePublishable(TinTuyenDung job)
    {
        if (string.IsNullOrWhiteSpace(job.TieuDe) || string.IsNullOrWhiteSpace(job.MoTaCongViec) ||
            string.IsNullOrWhiteSpace(job.YeuCauCongViec) || string.IsNullOrWhiteSpace(job.DiaDiemLamViec))
            throw new ApiException("Cần điền tiêu đề, mô tả, yêu cầu công việc và địa điểm trước khi gửi duyệt.");
        if (!RecruitmentDeadline.IsOpen(job.NgayHetHan))
            throw new ApiException("Tin đã hết hạn. Hãy cập nhật ngày hết hạn trước khi gửi duyệt hoặc mở lại.");
    }

    public static async Task PrepareSkillEditAsync(IApplicationDbContext context, int id, CurrentNguoiDungContext user, CancellationToken ct)
    {
        var job = await context.TinTuyenDungs.AsTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (job == null) throw new ApiException("Không tìm thấy tin tuyển dụng.");
        if (!CanEdit(user, job) && user.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            throw new ApiException("Bạn không có quyền sửa kỹ năng của tin này.", 403);
        if (job.TrangThai is not (TrangThaiTinTuyenDung.Nhap or TrangThaiTinTuyenDung.TuChoi or TrangThaiTinTuyenDung.TamDung))
            throw new ApiException("Chỉ sửa kỹ năng khi tin ở trạng thái nháp, từ chối hoặc tạm dừng.");
        job.TrangThai = TrangThaiTinTuyenDung.Nhap;
        job.NguoiDaiDienDaDuyet = false;
        job.KetQuaSangLoc = "";
        job.LastModified = DateTime.UtcNow;
    }

    public static async Task ApplyAsync(IApplicationDbContext context, TinTuyenDung job, JobDraftInput input, CancellationToken ct)
    {
        if (!await context.DanhMucNghes.AnyAsync(x => x.Id == input.DanhMucNgheId, ct))
            throw new ApiException("Không tìm thấy danh mục nghề.");
        if (input.KyNangs != null)
        {
            var ids = input.KyNangs.Select(x => x.KyNangId).ToList();
            if (await context.KyNangs.CountAsync(x => ids.Contains(x.Id), ct) != ids.Count)
                throw new ApiException("Một hoặc nhiều kỹ năng không tồn tại.");
            if (job.Id > 0)
                context.KyNangTinTuyenDungs.RemoveRange(job.KyNangTinTuyenDungs);
            job.KyNangTinTuyenDungs = input.KyNangs.Select(x => new KyNangTinTuyenDung
            {
                TinTuyenDung = job, KyNangId = x.KyNangId, MucDoYeuCau = x.MucDoYeuCau
            }).ToList();
        }
        job.DanhMucNgheId = input.DanhMucNgheId;
        job.TieuDe = input.TieuDe?.Trim() ?? "";
        job.MoTaCongViec = input.MoTaCongViec?.Trim() ?? "";
        job.KinhNghiemYeuCau = input.KinhNghiemYeuCau?.Trim() ?? "";
        job.YeuCauCongViec = input.YeuCauCongViec?.Trim() ?? "";
        job.QuyenLoi = input.QuyenLoi?.Trim() ?? "";
        job.DiaDiemLamViec = input.DiaDiemLamViec?.Trim() ?? "";
        job.PhuongThucLamViec = input.PhuongThucLamViec;
        job.LuongToiThieu = input.LuongToiThieu;
        job.LuongToiDa = input.LuongToiDa;
        job.NgayHetHan = RecruitmentDeadline.FromDate(input.NgayHetHan);
        job.NguoiDaiDienDaDuyet = false;
        job.KetQuaSangLoc = "";
        if (job.Id > 0) job.LastModified = DateTime.UtcNow;
    }
}
