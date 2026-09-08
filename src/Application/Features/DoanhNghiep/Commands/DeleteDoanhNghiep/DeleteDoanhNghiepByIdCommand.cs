using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DoanhNghiep.Commands.DeleteDoanhNghiep;

public class DeleteDoanhNghiepByIdCommand : IRequest<Response<int>> { public int Id { get; set; } }

public class DeleteDoanhNghiepByIdCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteDoanhNghiepByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(DeleteDoanhNghiepByIdCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.DoanhNghieps.AsTracking().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy doanh nghiệp.");
        if (await context.TinTuyenDungs.AnyAsync(x => x.DoanhNghiepId == request.Id, cancellationToken)) return new Response<int>("Không thể xóa doanh nghiệp đang có tin tuyển dụng.");
        if (await context.HoSoNhaTuyenDungs.AnyAsync(x => x.DoanhNghiepId == request.Id, cancellationToken)) return new Response<int>("Không thể xóa doanh nghiệp đang có hồ sơ nhà tuyển dụng.");
        context.DoanhNghieps.Remove(entity); await context.SaveChangesAsync(cancellationToken); return new Response<int>(data: entity.Id, message: "Xóa doanh nghiệp thành công.");
    }
}
