using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Commands.FireTinTuyenDungTrigger
{
    /// <summary>
    /// Fire 1 trigger của người (GuiDuyet/TamDungTin/MoLaiTin/DongTin/Admin*).
    /// Trigger hệ thống (funnel/job) bị từ chối — chúng đi qua FireSystemAsync nội bộ.
    /// </summary>
    public class FireTinTuyenDungTriggerCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public TriggerTinTuyenDung Trigger { get; set; }
        public string GhiChu { get; set; }
    }

    public class FireTinTuyenDungTriggerCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        ITinTuyenDungWorkflowService workflow,
        ITinTuyenDungFunnelService funnel)
        : IRequestHandler<FireTinTuyenDungTriggerCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            FireTinTuyenDungTriggerCommand request,
            CancellationToken cancellationToken)
        {
            if (TinTuyenDungStateMachine.LaTriggerHeThong(request.Trigger))
            {
                return new Response<int>(
                    "Hành động này chỉ hệ thống được thực hiện.");
            }

            var entity = await context.TinTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy tin tuyển dụng.");
            }

            var machine = new TinTuyenDungStateMachine(workflow, current, entity);
            var trigger = request.Trigger;

            if (trigger == TriggerTinTuyenDung.AdminDuyet)
            {
                var vaiTroNguoiDang = await context.NguoiDungs
                    .AsNoTracking()
                    .Where(x => x.Id == entity.NguoiDangTinId)
                    .Select(x => x.VaiTro)
                    .FirstOrDefaultAsync(cancellationToken);
                if (vaiTroNguoiDang == VaiTroNguoiDung.NHAN_SU)
                    trigger = TriggerTinTuyenDung.AdminDuyetChoNguoiDaiDien;
            }

            try
            {
                await machine.FireAsync(
                    trigger,
                    request.GhiChu ?? string.Empty,
                    cancellationToken);
            }
            catch (ApiException ex)
            {
                return new Response<int>(ex.Message);
            }

            // Sau GuiDuyet, tin đang ở ChoDuyetHeThong — chạy funnel sàng lọc tự động
            // (Lớp 1 luật cứng + Lớp 2 chấm điểm) và fire ngay trigger hệ thống kết quả
            // để tin không kẹt lại trong trạng thái chờ duyệt.
            string message = "Cập nhật trạng thái tin thành công.";
            if (request.Trigger == TriggerTinTuyenDung.GuiDuyet)
            {
                try
                {
                    var ketQua = await funnel.ChayAsync(entity, cancellationToken);

                    await machine.FireSystemAsync(
                        ketQua.Trigger,
                        ketQua.Note,
                        cancellationToken);

                    message = ketQua.Trigger switch
                    {
                        TriggerTinTuyenDung.HeThongTuDongDuyet =>
                            $"Tin đã qua funnel kiểm duyệt tự động và đang công khai. ({ketQua.Note})",
                        TriggerTinTuyenDung.HeThongDuyetChoNguoiDaiDien =>
                            $"Tin đã qua kiểm duyệt hệ thống và đang chờ Người đại diện duyệt. ({ketQua.Note})",
                        TriggerTinTuyenDung.PhatHienNghiVan =>
                            $"Tin rơi vào vùng nghi vấn, chờ Admin kiểm tra. ({ketQua.Note})",
                        TriggerTinTuyenDung.HeThongTuChoi =>
                            $"Tin bị hệ thống từ chối: {ketQua.Note}",
                        _ => message
                    };
                }
                catch (Exception ex)
                {
                    // Funnel lỗi → tin vẫn ở ChoDuyetHeThong (state đã fire ở trên), lưu lại
                    // và báo rõ lỗi — không mất trạng thái gửi duyệt của HR.
                    context.TinTuyenDungs.Update(entity);
                    await context.SaveChangesAsync(cancellationToken);
                    return new Response<int>(
                        data: entity.Id,
                        message: $"Tin đã gửi duyệt nhưng sàng lọc tự động gặp lỗi: {ex.Message}");
                }
            }

            // Context mặc định dùng NoTracking. Đánh dấu rõ entity đã đổi để trạng thái
            // không chỉ thay đổi trong state machine mà chắc chắn được ghi xuống database.
            context.TinTuyenDungs.Update(entity);
            await context.SaveChangesAsync(
                cancellationToken);

            var persistedState = await context.TinTuyenDungs
                .AsNoTracking()
                .Where(x => x.Id == entity.Id)
                .Select(x => x.TrangThai)
                .FirstOrDefaultAsync(cancellationToken);

            if (persistedState != entity.TrangThai)
            {
                return new Response<int>(
                    $"Không thể lưu trạng thái tin. Trạng thái hiện tại vẫn là '{persistedState}'.");
            }

            return new Response<int>(
                data: entity.Id,
                message: message);
        }
    }
}
