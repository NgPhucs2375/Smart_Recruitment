using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services.StateMachineLoiMoi
{
    /// <summary>
    /// Quét lời mời ChoXacNhan quá NgayHetHan rồi fire DanhDauHetHan (system, bypass auth).
    /// Entity phải load AsTracking vì DbContext đặt NoTracking toàn cục:
    /// state machine chỉ gán _entity.LoiMoi trong RAM nên không track thì SaveChanges
    /// vẫn ghi notification mà trạng thái không đổi, job chạy lại mỗi giờ.
    /// </summary>
    public static class LoiMoiHetHanSweeper
    {
        public static async Task<int> QuetAsync(
            IApplicationDbContext context,
            ILoiMoiNhanSuWorkflowService workflow,
            ICurrentNguoiDungService current,
            ILogger logger,
            CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            var quaHan = await context.LoiMoiNhanSus
                .AsTracking()
                .Include(l => l.DoanhNghiep)
                .Where(l => l.LoiMoi == TrangThaiLoiMoi.ChoXacNhan && l.NgayHetHan < now)
                .ToListAsync(ct);

            foreach (var loiMoi in quaHan)
            {
                try
                {
                    var machine = new LoiMoiNhanSuStateMachine(workflow, current, loiMoi);
                    await machine.FireSystemAsync(TriggerLoiMoi.DanhDauHetHan, "Lời mời hết hạn (job tự động).", ct);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Không thể đánh dấu hết hạn lời mời #{LoiMoiId}.", loiMoi.Id);
                }
            }

            if (quaHan.Count > 0)
                await context.SaveChangesAsync(ct);

            return quaHan.Count;
        }
    }
}
