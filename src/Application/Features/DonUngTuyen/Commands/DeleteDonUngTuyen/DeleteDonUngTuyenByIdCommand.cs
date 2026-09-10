using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DonUngTuyen.Commands.DeleteDonUngTuyen;

public class DeleteDonUngTuyenByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteDonUngTuyenByIdCommandHandler(IApplicationDbContext context) 
    : IRequestHandler<DeleteDonUngTuyenByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(DeleteDonUngTuyenByIdCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.DonUngTuyens.FindAsync([request.Id], cancellationToken);
        
        if (entity == null)
        {
            return new Response<int>("Không tìm thấy đơn ứng tuyển.");
        }

        context.DonUngTuyens.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(data: entity.Id, message: "Xóa đơn ứng tuyển thành công.");
    }
}