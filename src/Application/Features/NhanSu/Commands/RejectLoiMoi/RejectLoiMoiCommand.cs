using Application.Interfaces;
using Application.Services.StateMachineLoiMoi;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Commands.RejectLoiMoi
{
    /// <summary>
    /// Người được mời từ chối lời mời qua token link (ChoXacNhan -&gt; DaTuChoi).
    /// Token chính là credential — không yêu cầu đăng nhập, cho phép anonymous.
    /// </summary>
    public class RejectLoiMoiCommand : IRequest<Response<int>>
    {
        public string Token { get; set; }
    }

    public class RejectLoiMoiCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        ILoiMoiNhanSuWorkflowService workflow)
        : IRequestHandler<RejectLoiMoiCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            RejectLoiMoiCommand request,
            CancellationToken cancellationToken)
        {
            var token = (request.Token ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(token))
                return new Response<int>("Link lời mời thiếu token.");

            var entity = await context.LoiMoiNhanSus
                .FirstOrDefaultAsync(l => l.Token == token, cancellationToken);
            if (entity == null)
                return new Response<int>("Lời mời không tồn tại.");

            var machine = new LoiMoiNhanSuStateMachine(workflow, current, entity);
            try
            {
                await machine.FireByTokenAsync(TriggerLoiMoi.TuChoi, "Người được mời từ chối.", cancellationToken);
            }
            catch (Application.Exceptions.ApiException ex)
            {
                await context.SaveChangesAsync(cancellationToken);
                return new Response<int>(ex.Message);
            }

            await context.SaveChangesAsync(cancellationToken);
            return new Response<int>(entity.Id, "Bạn đã từ chối lời mời.");
        }
    }
}
