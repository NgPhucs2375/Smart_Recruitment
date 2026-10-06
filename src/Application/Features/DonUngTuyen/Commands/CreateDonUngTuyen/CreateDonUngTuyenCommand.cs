using System.Text.Json;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Services.StateMachineDonUngTuyen;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;

public class CreateDonUngTuyenCommand : IRequest<Response<int>>
{
    public int TinTuyenDungId { get; set; }
    public int CVUngVienId { get; set; }
}
public class CreateDonUngTuyenCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current,
    IDonUngTuyenWorkflowService workflow, ICvReadMapper mapper)
    : IRequestHandler<CreateDonUngTuyenCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateDonUngTuyenCommand request, CancellationToken ct)
    {
        var user = await current.ResolveAsync();
        if (user.VaiTro != VaiTroNguoiDung.UNG_VIEN) return new Response<int>("Chỉ ứng viên được nộp hồ sơ.");
        var cv = await context.CVUngViens.AsNoTracking().Include(x => x.HoSoUngVien)
            .Include(x => x.ThongTinLienHe).Include(x => x.HocVans).Include(x => x.KyNangs).Include(x => x.ChungChis)
            .Include(x => x.KinhNghiems).ThenInclude(x => x.KyNangs)
            .Include(x => x.DuAns).ThenInclude(x => x.CongNghes)
            .FirstOrDefaultAsync(x => x.Id == request.CVUngVienId && !x.IsDaXoa && x.HoSoUngVien.NguoiDungId == user.Id, ct);
        if (cv == null) return new Response<int>("Không tìm thấy CV thuộc về bạn.");
        var job = await context.TinTuyenDungs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId, ct);
        if (job == null || job.TrangThai != TrangThaiTinTuyenDung.DangTuyen || !Domain.Common.RecruitmentDeadline.IsOpen(job.NgayHetHan))
            return new Response<int>("Tin tuyển dụng không còn nhận hồ sơ.");
        var profileId = cv.HoSoUngVienId;
        if (await AlreadyAppliedAsync()) return new Response<int>("Bạn đã nộp đơn cho tin này.");
        var version = await context.CVPhienBans.AsNoTracking().Where(x => x.CVUngVienId == cv.Id)
            .OrderByDescending(x => x.SoPhienBan).Select(x => (int?)x.Id).FirstOrDefaultAsync(ct);
        var application = new Domain.Entities.DonUngTuyen
        {
            TinTuyenDungId = job.Id, CVUngVienId = cv.Id, CVPhienBanId = version, HoSoUngVienId = profileId,
            CvSnapshotJson = JsonSerializer.Serialize(mapper.Map(cv)), NgayUngTuyen = DateTime.UtcNow,
            TrangThai = TrangThaiDonUngTuyen.KhoiTao, GhiChu = ""
        };
        try
        {
            return await context.InTransactionAsync(async () =>
            {
                context.DonUngTuyens.Add(application);
                var machine = new DonUngTuyenStateMachine(workflow, current, application);
                await machine.FireSystemAsync(TriggerDonUngTuyen.XuLyHoSoThanhCong, "Hồ sơ hợp lệ, chờ nhà tuyển dụng xử lý.", ct, runSideEffects: false);
                await context.SaveChangesAsync(ct);
                await workflow.HandleSideEffectsAsync(application, TriggerDonUngTuyen.XuLyHoSoThanhCong, "Hồ sơ hợp lệ, chờ nhà tuyển dụng xử lý.", ct);
                await context.SaveChangesAsync(ct);
                return new Response<int>(application.Id, "Đã nộp hồ sơ. Bạn có thể theo dõi kết quả tại Việc đã ứng tuyển.");
            }, ct);
        }
        catch (DbUpdateException)
        {
            if (await AlreadyAppliedAsync()) return new Response<int>("Bạn đã nộp đơn cho tin này.");
            throw;
        }
        Task<bool> AlreadyAppliedAsync() => context.DonUngTuyens.AsNoTracking().AnyAsync(d => d.TinTuyenDungId == job.Id &&
            (d.HoSoUngVienId == profileId || (d.HoSoUngVienId == null && d.CVUngVien.HoSoUngVienId == profileId)), ct);
    }
}
