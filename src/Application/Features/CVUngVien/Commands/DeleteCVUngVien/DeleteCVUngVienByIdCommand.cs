using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.DeleteCVUngVien;

public class DeleteCVUngVienByIdCommand : IRequest<Response<int>> { public int Id { get; set; } }

public class DeleteCVUngVienByIdCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteCVUngVienByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(DeleteCVUngVienByIdCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.CVUngViens.FindAsync([request.Id], cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy CV.");
        if (await context.DonUngTuyens.AnyAsync(x => x.CVUngVienId == request.Id, cancellationToken)) return new Response<int>("Không thể xóa CV đã được dùng để ứng tuyển.");
        context.CVUngViens.Remove(entity); await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Xóa CV thành công.");
    }
}
