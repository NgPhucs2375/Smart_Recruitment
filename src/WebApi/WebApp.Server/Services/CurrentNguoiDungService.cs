using Application.Exceptions;
using Application.Interfaces;
using Domain.Enums;
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
            if (!nd.IsActive) throw new ApiException("Tài khoản đã bị vô hiệu hóa.", 403);

            int? doanhNghiepId = null;
            if (nd.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                doanhNghiepId = await _context.DoanhNghieps.Where(d => d.NguoiDaiDienId == nd.Id)
                    .OrderBy(d => d.Id).Select(d => (int?)d.Id).FirstOrDefaultAsync();
            }
            else if (nd.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                var companies = await _context.HoSoNhaTuyenDungs.Where(h => h.NguoiDungId == nd.Id)
                    .Select(h => h.DoanhNghiepId).Distinct().Take(2).ToListAsync();
                if (companies.Count > 1) throw new ApiException("Tài khoản Nhân sự có liên kết doanh nghiệp không nhất quán.", 403);
                doanhNghiepId = companies.Count == 1 ? companies[0] : null;
            }
            // Candidate/Admin must not inherit tenant access from stale recruiter profiles.

            return new CurrentNguoiDungContext
            {
                Id = nd.Id,
                DoanhNghiepId = doanhNghiepId,
                VaiTro = nd.VaiTro
            };
        }
    }
}
