using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
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
        ITinTuyenDungWorkflowService workflow)
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

            try
            {
                await machine.FireAsync(
                    request.Trigger,
                    request.GhiChu ?? string.Empty,
                    cancellationToken);
            }
            catch (ApiException ex)
            {
                return new Response<int>(ex.Message);
            }

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Cập nhật trạng thái tin thành công.");
        }
    }
}
