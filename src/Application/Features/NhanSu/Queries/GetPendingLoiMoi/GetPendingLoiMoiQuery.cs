using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Queries.GetPendingLoiMoi
{
    public class LoiMoiPendingVm
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string HoTen { get; set; }
        public string ChucVu { get; set; }
        public string Token { get; set; }
        public DateTime NgayHetHan { get; set; }
        public string InviteLink { get; set; }
    }

    /// <summary>
    /// Danh sách lời mời đang chờ của doanh nghiệp hiện tại (kèm link để copy khi email lỗi).
    /// </summary>
    public class GetPendingLoiMoiQuery : IRequest<Response<IEnumerable<LoiMoiPendingVm>>>
    {
        public string Origin { get; set; }
    }

    public class GetPendingLoiMoiQueryHandler(
        IApplicationDbContext context,
        IAuthenticatedUserService auth)
        : IRequestHandler<GetPendingLoiMoiQuery, Response<IEnumerable<LoiMoiPendingVm>>>
    {
        public async Task<Response<IEnumerable<LoiMoiPendingVm>>> Handle(
            GetPendingLoiMoiQuery request,
            CancellationToken cancellationToken)
        {
            var ndd = await context.NguoiDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ApplicationUserId == auth.UserId, cancellationToken);
            if (ndd == null)
                return new Response<IEnumerable<LoiMoiPendingVm>>("Không xác định người dùng.");

            var hs = await context.HoSoNhaTuyenDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.NguoiDungId == ndd.Id, cancellationToken);
            if (hs == null)
                return new Response<IEnumerable<LoiMoiPendingVm>>("Không xác định doanh nghiệp.");

            var origin = (request.Origin ?? string.Empty).TrimEnd('/');
            var now = DateTime.UtcNow;

            var list = await context.LoiMoiNhanSus
                .AsNoTracking()
                .Where(l => l.DoanhNghiepId == hs.DoanhNghiepId
                    && l.LoiMoi == TrangThaiLoiMoi.ChoXacNhan
                    && l.NgayHetHan > now)
                .OrderByDescending(l => l.Id)
                .Select(l => new LoiMoiPendingVm
                {
                    Id = l.Id,
                    Email = l.Email,
                    HoTen = l.HoTen,
                    ChucVu = l.ChucVu,
                    Token = l.Token,
                    NgayHetHan = l.NgayHetHan,
                    InviteLink = string.Empty
                })
                .ToListAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(origin))
            {
                foreach (var item in list)
                    item.InviteLink = $"{origin}/accept-invite?token={item.Token}";
            }

            return new Response<IEnumerable<LoiMoiPendingVm>>(list);
        }
    }
}
