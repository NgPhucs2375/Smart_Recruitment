using System;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.Email;
using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.NhanSu.Commands.InviteNhanSu
{
    public class InviteNhanSuCommand : IRequest<Response<string>>
    {
        public string Email { get; set; }
        public string HoTen { get; set; }
        public string ChucVu { get; set; }
        public string Origin { get; set; }
    }

    public class InviteNhanSuCommandHandler : IRequestHandler<InviteNhanSuCommand, Response<string>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IAuthenticatedUserService _auth;
        private readonly IEmailService _email;

        public InviteNhanSuCommandHandler(IApplicationDbContext context, IAuthenticatedUserService auth, IEmailService email)
        {
            _context = context;
            _auth = auth;
            _email = email;
        }

        public async Task<Response<string>> Handle(InviteNhanSuCommand r, CancellationToken ct)
        {
            var ndd = await _context.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId, ct);
            if (ndd == null || ndd.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
                throw new ApiException("Chỉ Người đại diện mới được mời nhân sự.");

            var hs = await _context.HoSoNhaTuyenDungs.FirstOrDefaultAsync(h => h.NguoiDungId == ndd.Id, ct);
            if (hs == null)
                throw new ApiException("Không xác định được doanh nghiệp của bạn.");

            var invitation = new LoiMoiNhanSu
            {
                DoanhNghiepId = hs.DoanhNghiepId,
                NguoiDaiDienId = ndd.Id,
                Email = r.Email,
                HoTen = r.HoTen,
                ChucVu = r.ChucVu,
                Token = Guid.NewGuid().ToString("N"),
                LoiMoi = TrangThaiLoiMoi.ChoXacNhan,
                NgayHetHan = DateTime.UtcNow.AddDays(7)
            };

            await _context.LoiMoiNhanSus.AddAsync(invitation, ct);
            await _context.SaveChangesAsync(ct);

            var link = $"{r.Origin?.TrimEnd('/')}/accept-invite?token={invitation.Token}";
            await _email.SendAsync(new EmailRequest
            {
                To = r.Email,
                Subject = "Lời mời tham gia Doanh nghiệp",
                Body = $"Bạn được mời trở thành Nhân sự của doanh nghiệp. Nhấn vào liên kết sau để chấp nhận: {link}"
            });

            return new Response<string>(invitation.Token, "Đã gửi lời mời qua email.");
        }
    }
}
