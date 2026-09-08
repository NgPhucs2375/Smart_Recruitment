using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineDonUngTuyen;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen
{
    public class UpdateDonUngTuyenCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public TriggerDonUngTuyen Trigger { get; set; }
        public string GhiChu { get; set; }
    }

    public class UpdateDonUngTuyenCommandHandler : IRequestHandler<UpdateDonUngTuyenCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;
        private readonly IDonUngTuyenWorkflowService _workflow;

        public UpdateDonUngTuyenCommandHandler(
            IApplicationDbContext context,
            ICurrentNguoiDungService current,
            IDonUngTuyenWorkflowService workflow)
        {
            _context = context;
            _current = current;
            _workflow = workflow;
        }

        public async Task<Response<int>> Handle(UpdateDonUngTuyenCommand r, CancellationToken ct)
        {
            var entity = await _context.DonUngTuyens
                .Include(d => d.TinTuyenDung)
                .Include(d => d.HoSoUngVien)
                .FirstOrDefaultAsync(d => d.Id == r.Id, ct);
            if (entity == null)
                return new Response<int>("Không tìm thấy đơn ứng tuyển.");

            var sm = new DonUngTuyenStateMachine(_workflow, _current, entity);
            await sm.FireAsync(r.Trigger, r.GhiChu, ct);

            var ctx = await _current.ResolveAsync();
            entity.NguoiXuLyId = ctx.Id;

            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Cập nhật đơn ứng tuyển thành công.");
        }
    }
}
