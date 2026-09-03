using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
public class UpdateDonUngTuyenCommand : IRequest<Response<int>> { public int Id { get; set; } public TrangThaiDonUngTuyen TrangThai { get; set; } }
public class UpdateDonUngTuyenCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateDonUngTuyenCommand, Response<int>>
{ public async Task<Response<int>> Handle(UpdateDonUngTuyenCommand request, CancellationToken cancellationToken) { var entity = await context.DonUngTuyens.FindAsync([request.Id], cancellationToken); if (entity == null) return new Response<int>("Không tìm thấy đơn ứng tuyển."); entity.TrangThai = request.TrangThai; await context.SaveChangesAsync(cancellationToken); return new Response<int>(data: entity.Id, message: "Cập nhật trạng thái đơn ứng tuyển thành công."); } }
