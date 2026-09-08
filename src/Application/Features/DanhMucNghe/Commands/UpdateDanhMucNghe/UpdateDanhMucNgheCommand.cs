using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;
public class UpdateDanhMucNgheCommand : IRequest<Response<int>> { 
    public int Id { get; set; } 
    public string TenNghe { get; set; } 
    public string MoTa { get; set; } }
public class UpdateDanhMucNgheCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateDanhMucNgheCommand, Response<int>>
{ public async Task<Response<int>> Handle(UpdateDanhMucNgheCommand request, CancellationToken cancellationToken) {
        var entity = await context.DanhMucNghes.FindAsync([request.Id], cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy danh mục nghề.");
        if (await context.DanhMucNghes.AnyAsync(x => x.Id != request.Id && x.TenNghe == request.TenNghe, cancellationToken))
            return new Response<int>("Tên ngành nghề đã tồn tại."); entity.TenNghe = request.TenNghe; entity.MoTa = request.MoTa;
        await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Cập nhật danh mục nghề thành công.");
    }
}
