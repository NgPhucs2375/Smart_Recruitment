using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.DeleteCVUngVien;

public class DeleteCVUngVienByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteCVUngVienByIdCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteCVUngVienByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(DeleteCVUngVienByIdCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.CVUngViens.FindAsync([request.Id], cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy CV.");
        if (entity.TrangThaiCV == TrangThaiCV.VoHieuHoa) return new Response<int>("CV đã được xóa trước đó.");

        // Xóa mềm: giữ record để DonUngTuyen cũ vẫn tham chiếu được (FK CVUngVienId).
        // Sau này có CVStateMachine thì thay bằng: await machine.FireAsync(TriggerCVUngVien.VoHieuHoa).
        bool wasDefault = entity.IsDefault;
        entity.TrangThaiCV = TrangThaiCV.VoHieuHoa;
        entity.IsDefault = false;

        // Nếu CV bị xóa là default thì đôn CV SanSang mới nhất khác lên default.
        if (wasDefault)
        {
            var replacement = await context.CVUngViens
                .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId
                    && x.Id != entity.Id
                    && x.TrangThaiCV == TrangThaiCV.SanSang)
                .OrderByDescending(x => x.NgayUpload)
                .FirstOrDefaultAsync(cancellationToken);
            if (replacement != null) replacement.IsDefault = true;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Đã vô hiệu hóa CV thành công.");
    }
}
