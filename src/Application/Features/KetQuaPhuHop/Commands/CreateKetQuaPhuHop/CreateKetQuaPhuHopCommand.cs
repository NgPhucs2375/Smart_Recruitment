using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using KetQuaPhuHopEntity = global::Domain.Entities.KetQuaPhuHop;

namespace Application.Features.KetQuaPhuHop.Commands.CreateKetQuaPhuHop;

public class CreateKetQuaPhuHopCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }

    public int TinTuyenDungId { get; set; }

    public float DiemPhuHop { get; set; }

    public PhanLoaiKetQua PhanLoai { get; set; }
}

public class CreateKetQuaPhuHopCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<CreateKetQuaPhuHopCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKetQuaPhuHopCommand request,
        CancellationToken cancellationToken)
    {
        var hoSoTonTai = await context.HoSoUngViens
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.HoSoUngVienId,
                cancellationToken);

        if (!hoSoTonTai)
        {
            return new Response<int>(
                "Không tìm thấy hồ sơ ứng viên.");
        }

        var tinTuyenDungTonTai = await context.TinTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.TinTuyenDungId,
                cancellationToken);

        if (!tinTuyenDungTonTai)
        {
            return new Response<int>(
                "Không tìm thấy tin tuyển dụng.");
        }

        var daTonTai = await context.KetQuaPhuHops
            .AsNoTracking()
            .AnyAsync(
                x => x.HoSoUngVienId == request.HoSoUngVienId &&
                     x.TinTuyenDungId == request.TinTuyenDungId,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Đã tồn tại kết quả phù hợp giữa ứng viên và tin tuyển dụng này.");
        }

        var entity = new KetQuaPhuHopEntity
        {
            HoSoUngVienId = request.HoSoUngVienId,
            TinTuyenDungId = request.TinTuyenDungId,
            DiemPhuHop = request.DiemPhuHop,
            PhanLoai = request.PhanLoai
        };

        await context.KetQuaPhuHops.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo kết quả phù hợp thành công.");
    }
}