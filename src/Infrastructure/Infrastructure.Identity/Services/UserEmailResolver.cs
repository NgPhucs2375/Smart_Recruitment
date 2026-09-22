#nullable enable
using Application.Interfaces;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Services
{
    public class UserEmailResolver : IUserEmailResolver
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IApplicationDbContext _context;

        public UserEmailResolver(UserManager<ApplicationUser> userManager, IApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public async Task<string?> GetEmailByNguoiDungIdAsync(int nguoiDungId, CancellationToken ct = default)
        {
            var appUserId = await _context.NguoiDungs
                .Where(n => n.Id == nguoiDungId)
                .Select(n => n.ApplicationUserId)
                .FirstOrDefaultAsync(ct);
            if (string.IsNullOrEmpty(appUserId))
                return null;

            var user = await _userManager.FindByIdAsync(appUserId);
            return user?.Email;
        }
    }
}
