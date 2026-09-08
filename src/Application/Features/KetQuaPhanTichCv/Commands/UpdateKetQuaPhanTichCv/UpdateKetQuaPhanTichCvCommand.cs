using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhanTichCv.Commands.UpdateKetQuaPhanTichCv;

public class UpdateKetQuaPhanTichCvCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public int CVUngVienId { get; set; }
    public string NoiDungTrichXuat { get; set; }
    public string KyNangTrichXuat { get; set; }
    public string KinhNghiemTrichXuat { get; set; }
}

public class UpdateKetQuaPhanTichCvCommandHandler(IApplicationDbContext context) 
    : IRequestHandler<UpdateKetQuaPhanTichCvCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateKetQuaPhanTichCvCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.KetQuaPhanTichCvs.FindAsync([request.Id], cancellationToken);
        
        if (entity == null)
        {
            return new Response<int>("Không tìm thấy kết quả phân tích CV.");
        }

        if (!await context.CVUngViens.AnyAsync(x => x.Id == request.CVUngVienId, cancellationToken))
        {
            return new Response<int>("Không tìm thấy CV.");
        }

        entity.CVUngVienId = request.CVUngVienId;
        entity.NoiDungTrichXuat = request.NoiDungTrichXuat;
        entity.KyNangTrichXuat = request.KyNangTrichXuat;
        entity.KinhNghiemTrichXuat = request.KinhNghiemTrichXuat;

        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(entity.Id, "Cập nhật kết quả phân tích CV thành công.");
    }
}