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

    public class DeleteTinTuyenDungCommandHandler : IRequestHandler<DeleteTinTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;
        private readonly ITinTuyenDungWorkflowService _workflow;

        public DeleteTinTuyenDungCommandHandler(
            IApplicationDbContext context,
            ICurrentNguoiDungService current,
            ITinTuyenDungWorkflowService workflow)
        {
            _context = context;
            _current = current;
            _workflow = workflow;
        }

        public async Task<Response<int>> Handle(DeleteTinTuyenDungCommand r, CancellationToken ct)
        {
            var entity = await _context.TinTuyenDungs.FindAsync(new object[] { r.Id }, ct);
            if (entity == null)
                return new Response<int>("Không tìm thấy tin tuyển dụng.");

            // Xóa mềm qua state machine để giữ record cho DonUngTuyen tham chiếu
            // + cascade đóng các đơn đang dở dang trong workflow.
            // HR: DongTin | Admin: AdminCuongCheKhoa (quyền check trong machine).
            var ctx = await _current.ResolveAsync();
            var trigger = ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN
                ? TriggerTinTuyenDung.AdminCuongCheKhoa
                : TriggerTinTuyenDung.DongTin;

            var machine = new TinTuyenDungStateMachine(_workflow, _current, entity);
            try
            {
                await machine.FireAsync(trigger, "Xóa tin tuyển dụng.", ct);
            }
            catch (ApiException ex)
            {
                return new Response<int>(ex.Message);
            }

            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Xóa tin tuyển dụng thành công.");
        }
    }
}
