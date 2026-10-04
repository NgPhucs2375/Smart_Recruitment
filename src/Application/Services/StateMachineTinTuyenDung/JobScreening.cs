using Application.Exceptions;
using Domain.Entities;
using Domain.Enums;

namespace Application.Services.StateMachineTinTuyenDung;

public static class JobScreening
{
    public static async Task<string> RunAsync(TinTuyenDung job, TinTuyenDungStateMachine machine,
        ITinTuyenDungFunnelService funnel, CancellationToken ct)
    {
        if (job.TrangThai != TrangThaiTinTuyenDung.ChoDuyetHeThong)
            throw new ApiException("Tin chưa đến bước sàng lọc hệ thống.");
        if (job.NguoiDangTin?.VaiTro == VaiTroNguoiDung.NHAN_SU && !job.NguoiDaiDienDaDuyet)
        {
            job.KetQuaSangLoc = "";
            await machine.FireSystemAsync(TriggerTinTuyenDung.HeThongDuyetChoNguoiDaiDien,
                "Tin Nhân sự cần Người đại diện duyệt trước khi chạy bộ lọc.", ct);
            return "Tin đang chờ Người đại diện duyệt; chưa chạy bộ lọc.";
        }
        KetQuaFunnel assessment;
        try { assessment = await funnel.ChayAsync(job, ct); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception)
        {
            return "Tin đang chờ bộ lọc hệ thống. Sàng lọc gặp lỗi và sẽ được tự động thử lại; chưa công khai.";
        }
        await machine.FireSystemAsync(assessment.Trigger, assessment.Note, ct);
        return job.TrangThai == TrangThaiTinTuyenDung.DangTuyen
            ? $"Bộ lọc hệ thống OK. Tin đã công khai. ({assessment.Note})"
            : $"Bộ lọc phát hiện vi phạm hoặc nghi vấn. Tin chờ Admin duyệt tay, chưa công khai. ({assessment.Note})";
    }
}
