using Application.Interfaces;
using Application.Services.Matching;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Commands.TinhDiemPhuHop;

/// <summary>
/// Tính lại điểm phù hợp cho 1 cặp hồ sơ - tin và lưu (upsert) KetQuaPhuHop.
/// </summary>
public class TinhDiemPhuHopCommand : IRequest<Response<MatchingResultDto>>
{
    public int HoSoUngVienId { get; set; }

    public int TinTuyenDungId { get; set; }

    public int? CVUngVienId { get; set; }
}

public class TinhDiemPhuHopCommandHandler(
    IApplicationDbContext context,
    IMatchingService matching)
    : IRequestHandler<TinhDiemPhuHopCommand, Response<MatchingResultDto>>
{
    public async Task<Response<MatchingResultDto>> Handle(
        TinhDiemPhuHopCommand request,
        CancellationToken cancellationToken)
    {
        var ketQua = await matching.CalculateAsync(
            request.HoSoUngVienId,
            request.TinTuyenDungId,
            request.CVUngVienId,
            cancellationToken);

        if (!ketQua.ThanhCong)
        {
            return new Response<MatchingResultDto>(
                ketQua.ThongBaoLoi);
        }

        var entity = await context.KetQuaPhuHops
            .FirstOrDefaultAsync(
                x => x.HoSoUngVienId == request.HoSoUngVienId &&
                     x.TinTuyenDungId == request.TinTuyenDungId,
                cancellationToken);

        if (entity == null)
        {
            entity = new Domain.Entities.KetQuaPhuHop
            {
                HoSoUngVienId = request.HoSoUngVienId,
                TinTuyenDungId = request.TinTuyenDungId
            };

            await context.KetQuaPhuHops.AddAsync(
                entity,
                cancellationToken);
        }

        entity.DiemPhuHop = ketQua.DiemPhuHop;
        entity.PhanLoai = ketQua.PhanLoai;
        entity.KyNangThoa = string.Join("; ", ketQua.KyNangThoa);
        entity.KyNangThieu = string.Join("; ", ketQua.KyNangThieu);
        entity.GhiChu = "Tính lại điểm thủ công.";

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<MatchingResultDto>(
            data: ketQua,
            message: "Tính điểm phù hợp thành công.");
    }
}
