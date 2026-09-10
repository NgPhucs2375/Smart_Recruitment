using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using KetQuaPhanTichCvEntity = global::Domain.Entities.KetQuaPhanTichCv;

namespace Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;

public class CreateKetQuaPhanTichCvCommand : IRequest<Response<int>>
{
    public int CVUngVienId { get; set; }

    public string NoiDungTrichXuat { get; set; }

    public string KyNangTrichXuat { get; set; }

    public string KinhNghiemTrichXuat { get; set; }
}

public class CreateKetQuaPhanTichCvCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<CreateKetQuaPhanTichCvCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKetQuaPhanTichCvCommand request,
        CancellationToken cancellationToken)
    {
        var cv = await context.CVUngViens
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.CVUngVienId &&
                     !x.IsDaXoa,
                cancellationToken);

        if (cv == null)
        {
            return new Response<int>(
                "Không tìm thấy CV.");
        }

        var daPhanTich = await context.KetQuaPhanTichCvs
            .AsNoTracking()
            .AnyAsync(
                x => x.CVUngVienId == request.CVUngVienId,
                cancellationToken);

        if (daPhanTich)
        {
            return new Response<int>(
                "CV này đã có kết quả phân tích.");
        }

        var entity = new KetQuaPhanTichCvEntity
        {
            CVUngVienId = request.CVUngVienId,

            NoiDungTrichXuat =
                request.NoiDungTrichXuat?.Trim(),

            KyNangTrichXuat =
                request.KyNangTrichXuat?.Trim(),

            KinhNghiemTrichXuat =
                request.KinhNghiemTrichXuat?.Trim()
        };

        await context.KetQuaPhanTichCvs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo kết quả phân tích CV thành công.");
    }
}