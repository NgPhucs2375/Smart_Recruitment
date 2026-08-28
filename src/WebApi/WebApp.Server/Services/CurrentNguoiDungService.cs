using Application.Exceptions;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace WebApp.Server.Services
{
    public class CurrentNguoiDungService : ICurrentNguoiDungService
    {
        private readonly IAuthenticatedUserService _auth;
        private readonly IApplicationDbContext _context;

        public CurrentNguoiDungService(IAuthenticatedUserService auth, IApplicationDbContext context)
        {
            _auth = auth;
            _context = context;
        }

        public async Task<CurrentNguoiDungContext> ResolveAsync()
        {
            var nd = await _context.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId);
            if (nd == null)
                throw new ApiException("Không xác định được người dùng.");

            var hs = await _context.HoSoNhaTuyenDungs.FirstOrDefaultAsync(h => h.NguoiDungId == nd.Id);

            return new CurrentNguoiDungContext
            {
                Id = nd.Id,
                DoanhNghiepId = hs?.DoanhNghiepId,
                VaiTro = nd.VaiTro
            };
        }
    }
}
