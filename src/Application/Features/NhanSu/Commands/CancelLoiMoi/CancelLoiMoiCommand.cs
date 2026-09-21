using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineLoiMoi;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Commands.CancelLoiMoi
{
    /// <summary>
    /// Người đại diện thu hồi lời mời đang chờ (ChoXacNhan -&gt; DaHuy).
    /// </summary>
    public class CancelLoiMoiCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class CancelLoiMoiCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        ILoiMoiNhanSuWorkflowService workflow)
        : IRequestHandler<CancelLoiMoiCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            CancelLoiMoiCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.LoiMoiNhanSus
                .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken);
            if (entity == null)
                throw new ApiException("Không tìm thấy lời mời.");

            var machine = new LoiMoiNhanSuStateMachine(workflow, current, entity);
            try
            {
                await machine.FireAsync(TriggerLoiMoi.HuyLoiMoi, "Người đại diện thu hồi lời mời.", cancellationToken);
            }
            catch (ApiException ex)
            {
                // Lazy-expiry có thể đã persist HetHan trước khi throw — vẫn lưu.
                await context.SaveChangesAsync(cancellationToken);
                throw new ApiException(ex.Message, ex.StatusCode);
            }

            await context.SaveChangesAsync(cancellationToken);
            return new Response<int>(entity.Id, "Đã hủy lời mời.");
        }
    }
}
