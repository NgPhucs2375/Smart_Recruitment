using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhanTichCv.Commands.DeleteKetQuaPhanTichCv;

public class DeleteKetQuaPhanTichCvByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteKetQuaPhanTichCvByIdCommandHandler(IApplicationDbContext context) 
    : IRequestHandler<DeleteKetQuaPhanTichCvByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(DeleteKetQuaPhanTichCvByIdCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.KetQuaPhanTichCvs.FindAsync([request.Id], cancellationToken);
        
        if (entity == null)
        {
            return new Response<int>("Không tìm thấy kết quả phân tích CV.");
        }

        context.KetQuaPhanTichCvs.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(entity.Id, "Xóa kết quả phân tích CV thành công.");
    }
}