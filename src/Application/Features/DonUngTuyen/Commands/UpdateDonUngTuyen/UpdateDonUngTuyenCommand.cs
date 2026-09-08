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
            // Trigger hệ thống (tiếp nhận/job/cascade) không đi qua API
            if (DonUngTuyenStateMachine.LaTriggerHeThong(r.Trigger))
                return new Response<int>("Hành động này chỉ hệ thống được thực hiện.");

            var entity = await _context.DonUngTuyens
                .Include(d => d.TinTuyenDung)
                .Include(d => d.HoSoUngVien)
                .FirstOrDefaultAsync(d => d.Id == r.Id, ct);
            if (entity == null)
                return new Response<int>("Không tìm thấy đơn ứng tuyển.");

            var sm = new DonUngTuyenStateMachine(_workflow, _current, entity);
            try
            {
                await sm.FireAsync(r.Trigger, r.GhiChu ?? string.Empty, ct);
            }
            catch (ApiException ex)
            {
                return new Response<int>(ex.Message);
            }

            // Lưu lý do duyệt/từ chối; chỉ gán người xử lý cho hành động của HR
            entity.GhiChu = r.GhiChu;
            if (r.Trigger == TriggerDonUngTuyen.XemDon
                || r.Trigger == TriggerDonUngTuyen.DanhGiaPhuHop
                || r.Trigger == TriggerDonUngTuyen.TuChoi)
            {
                var ctx = await _current.ResolveAsync();
                entity.NguoiXuLyId = ctx.Id;
            }

            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Cập nhật đơn ứng tuyển thành công.");
        }
    }
}
