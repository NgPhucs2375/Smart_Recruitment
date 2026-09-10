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

public class UpdateKetQuaPhanTichCvCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateKetQuaPhanTichCvCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateKetQuaPhanTichCvCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.KetQuaPhanTichCvs
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy kết quả phân tích CV.");
        }

        var cvTonTai = await context.CVUngViens
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.CVUngVienId && !x.IsDaXoa,
                cancellationToken);

        if (!cvTonTai)
        {
            return new Response<int>(
                "Không tìm thấy CV.");
        }

        var trungLap = await context.KetQuaPhanTichCvs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.CVUngVienId == request.CVUngVienId,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "CV này đã có kết quả phân tích.");
        }

        entity.CVUngVienId = request.CVUngVienId;
        entity.NoiDungTrichXuat = request.NoiDungTrichXuat?.Trim();
        entity.KyNangTrichXuat = request.KyNangTrichXuat?.Trim();
        entity.KinhNghiemTrichXuat = request.KinhNghiemTrichXuat?.Trim();

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật kết quả phân tích CV thành công.");
    }
}