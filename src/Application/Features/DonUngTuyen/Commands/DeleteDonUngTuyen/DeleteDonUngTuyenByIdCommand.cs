using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DonUngTuyen.Commands.DeleteDonUngTuyen;

public class DeleteDonUngTuyenByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteDonUngTuyenByIdCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<DeleteDonUngTuyenByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        DeleteDonUngTuyenByIdCommand request,
        CancellationToken cancellationToken)
    {
        // Xóa vật lý không nằm trong state machine (quy trình rút/từ chối
        // xử lý bằng trigger) nên chỉ admin mới được dọn dữ liệu.
        // Guard ở handler là lớp phòng thủ thứ hai sau grant donungtuyens#delete
        // đã bị PermissionPolicy chặn với mọi role khác admin.
        var actor = await current.ResolveAsync();
        if (actor.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            throw new ApiException("Chỉ quản trị viên được xóa đơn ứng tuyển.", 403);

        var entity = await context.DonUngTuyens
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy đơn ứng tuyển.");
        }

        context.DonUngTuyens.Remove(entity);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Xóa đơn ứng tuyển thành công.");
    }
}