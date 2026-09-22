using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Commands.UpdateKetQuaPhuHop;

public class UpdateKetQuaPhuHopCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public int HoSoUngVienId { get; set; }

    public int TinTuyenDungId { get; set; }

    public float DiemPhuHop { get; set; }

    public PhanLoaiKetQua PhanLoai { get; set; }
}

public class UpdateKetQuaPhuHopCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateKetQuaPhuHopCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateKetQuaPhuHopCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.KetQuaPhuHops
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy kết quả phù hợp.");
        }

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

        var tinTonTai = await context.TinTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.TinTuyenDungId,
                cancellationToken);

        if (!tinTonTai)
        {
            return new Response<int>(
                "Không tìm thấy tin tuyển dụng.");
        }

        var trungLap = await context.KetQuaPhuHops
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.HoSoUngVienId == request.HoSoUngVienId &&
                     x.TinTuyenDungId == request.TinTuyenDungId,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Đã tồn tại kết quả phù hợp giữa ứng viên và tin tuyển dụng này.");
        }

        entity.HoSoUngVienId = request.HoSoUngVienId;
        entity.TinTuyenDungId = request.TinTuyenDungId;
        entity.DiemPhuHop = request.DiemPhuHop;
        entity.PhanLoai = request.PhanLoai;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật kết quả phù hợp thành công.");
    }
}
