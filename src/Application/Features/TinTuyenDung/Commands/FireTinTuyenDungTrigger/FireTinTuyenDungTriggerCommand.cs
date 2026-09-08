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

    public class FireTinTuyenDungTriggerCommandHandler : IRequestHandler<FireTinTuyenDungTriggerCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;
        private readonly ITinTuyenDungWorkflowService _workflow;

        public FireTinTuyenDungTriggerCommandHandler(
            IApplicationDbContext context,
            ICurrentNguoiDungService current,
            ITinTuyenDungWorkflowService workflow)
        {
            _context = context;
            _current = current;
            _workflow = workflow;
        }

        public async Task<Response<int>> Handle(FireTinTuyenDungTriggerCommand r, CancellationToken ct)
        {
            if (TinTuyenDungStateMachine.LaTriggerHeThong(r.Trigger))
                return new Response<int>("Hành động này chỉ hệ thống được thực hiện.");

            var entity = await _context.TinTuyenDungs.FindAsync(new object[] { r.Id }, ct);
            if (entity == null)
                return new Response<int>("Không tìm thấy tin tuyển dụng.");

            var machine = new TinTuyenDungStateMachine(_workflow, _current, entity);
            try
            {
                await machine.FireAsync(r.Trigger, r.GhiChu ?? string.Empty, ct);
            }
            catch (ApiException ex)
            {
                return new Response<int>(ex.Message);
            }

            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Cập nhật trạng thái tin thành công.");
        }
    }
}
