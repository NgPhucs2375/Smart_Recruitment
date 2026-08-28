using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Commands.DeleteTinTuyenDung
{
    public class DeleteTinTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteTinTuyenDungCommandHandler : IRequestHandler<DeleteTinTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;

        public DeleteTinTuyenDungCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
        {
            _context = context;
            _current = current;
        }

        public async Task<Response<int>> Handle(DeleteTinTuyenDungCommand r, CancellationToken ct)
        {
            var entity = await _context.TinTuyenDungs.FindAsync(r.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy tin tuyển dụng.");

            var ctx = await _current.ResolveAsync();
            bool accessible = ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                ? entity.DoanhNghiepId == ctx.DoanhNghiepId
                : (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ? entity.NguoiDangTinId == ctx.Id : false);
            if (!accessible)
                throw new ApiException("Bạn không có quyền xóa tin tuyển dụng này.", 403);

            _context.TinTuyenDungs.Remove(entity);
            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Xóa tin tuyển dụng thành công.");
        }
    }
}
