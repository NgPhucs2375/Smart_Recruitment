using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Commands.DeleteTinTuyenDung
{
    public class DeleteTinTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteTinTuyenDungCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        ITinTuyenDungWorkflowService workflow)
        : IRequestHandler<DeleteTinTuyenDungCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteTinTuyenDungCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.TinTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy tin tuyển dụng.");
            }

            // Xóa mềm qua state machine để giữ record cho DonUngTuyen tham chiếu
            // + cascade đóng các đơn đang dở dang trong workflow.
            // HR: DongTin | Admin: AdminCuongCheKhoa (quyền check trong machine).
            var ctx = await current.ResolveAsync();

            var trigger = ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN
                ? TriggerTinTuyenDung.AdminCuongCheKhoa
                : TriggerTinTuyenDung.DongTin;

            var machine = new TinTuyenDungStateMachine(workflow, current, entity);

            try
            {
                await machine.FireAsync(
                    trigger,
                    "Xóa tin tuyển dụng.",
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
                message: "Xóa tin tuyển dụng thành công.");
        }
    }
}
