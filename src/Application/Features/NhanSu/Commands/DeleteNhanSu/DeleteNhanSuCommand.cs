using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Commands.DeleteNhanSu
{
    public class DeleteNhanSuCommand : IRequest<Response<string>>
    {
        public int Id { get; set; }
    }

    public class DeleteNhanSuCommandHandler : IRequestHandler<DeleteNhanSuCommand, Response<string>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IAuthenticatedUserService _auth;

        public DeleteNhanSuCommandHandler(IApplicationDbContext context, IAuthenticatedUserService auth)
        {
            _context = context;
            _auth = auth;
        }

        public async Task<Response<string>> Handle(DeleteNhanSuCommand c, CancellationToken ct)
        {
            var ndd = await _context.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId, ct);
            if (ndd == null)
                throw new ApiException("Không xác định người dùng.");

            var myHs = await _context.HoSoNhaTuyenDungs.FirstOrDefaultAsync(h => h.NguoiDungId == ndd.Id, ct);
            if (myHs == null)
                throw new ApiException("Không xác định doanh nghiệp.");

            var target = await _context.HoSoNhaTuyenDungs
                .Include(h => h.NguoiDung)
                .FirstOrDefaultAsync(h => h.Id == c.Id, ct);

            if (target == null)
                throw new ApiException("Không tìm thấy nhân sự.");
            if (target.DoanhNghiepId != myHs.DoanhNghiepId)
                throw new ApiException("Bạn không có quyền xóa nhân sự này.");

            _context.HoSoNhaTuyenDungs.Remove(target);
            if (target.NguoiDung != null)
            {
                target.NguoiDung.VaiTro = VaiTroNguoiDung.UNG_VIEN;
            }

            await _context.SaveChangesAsync(ct);
            return new Response<string>(target.NguoiDungId.ToString(), "Đã xóa nhân sự khỏi doanh nghiệp.");
        }
    }
}
