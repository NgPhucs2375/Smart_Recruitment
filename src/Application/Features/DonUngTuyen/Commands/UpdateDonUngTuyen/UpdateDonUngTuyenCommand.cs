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

    public class UpdateDonUngTuyenCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        IDonUngTuyenWorkflowService workflow)
        : IRequestHandler<UpdateDonUngTuyenCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            UpdateDonUngTuyenCommand request,
            CancellationToken cancellationToken)
        {
            // Trigger hệ thống (tiếp nhận/job/cascade) không đi qua API
            if (DonUngTuyenStateMachine.LaTriggerHeThong(request.Trigger))
            {
                return new Response<int>(
                    "Hành động này chỉ hệ thống được thực hiện.");
            }

            var entity = await context.DonUngTuyens
                .Include(d => d.TinTuyenDung)
                .Include(d => d.CVUngVien).ThenInclude(cv => cv.HoSoUngVien)
                .FirstOrDefaultAsync(
                    d => d.Id == request.Id,
                    cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy đơn ứng tuyển.");
            }

            var sm = new DonUngTuyenStateMachine(workflow, current, entity);

            try
            {
                await sm.FireAsync(
                    request.Trigger,
                    request.GhiChu ?? string.Empty,
                    cancellationToken);
            }
            catch (ApiException ex)
            {
                return new Response<int>(ex.Message);
            }

            // Lưu lý do duyệt/từ chối; chỉ gán người xử lý cho hành động của HR
            entity.GhiChu = request.GhiChu?.Trim();

            if (request.Trigger == TriggerDonUngTuyen.XemDon
                || request.Trigger == TriggerDonUngTuyen.DanhGiaPhuHop
                || request.Trigger == TriggerDonUngTuyen.TuChoi)
            {
                var ctx = await current.ResolveAsync();
                entity.NguoiXuLyId = ctx.Id;
            }

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Cập nhật đơn ứng tuyển thành công.");
        }
    }
}
