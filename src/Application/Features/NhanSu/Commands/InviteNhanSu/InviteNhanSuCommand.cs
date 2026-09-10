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

    public class InviteNhanSuCommandHandler(
        IApplicationDbContext context,
        IAuthenticatedUserService auth,
        IEmailService email)
        : IRequestHandler<InviteNhanSuCommand, Response<string>>
    {
        public async Task<Response<string>> Handle(
            InviteNhanSuCommand request,
            CancellationToken cancellationToken)
        {
            var emailMoi = request.Email?.Trim();
            var hoTen = request.HoTen?.Trim();
            var chucVu = request.ChucVu?.Trim();

            var ndd = await context.NguoiDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.ApplicationUserId == auth.UserId,
                    cancellationToken);

            if (ndd == null || ndd.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                throw new ApiException(
                    "Chỉ người đại diện mới được mời nhân sự.");
            }

            var hs = await context.HoSoNhaTuyenDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.NguoiDungId == ndd.Id,
                    cancellationToken);

            if (hs == null)
            {
                throw new ApiException(
                    "Không xác định được doanh nghiệp của bạn.");
            }

            var daMoi = await context.LoiMoiNhanSus
                .AsNoTracking()
                .AnyAsync(
                    x => x.DoanhNghiepId == hs.DoanhNghiepId &&
                         x.Email.ToLower() == emailMoi.ToLower() &&
                         x.LoiMoi == TrangThaiLoiMoi.ChoXacNhan &&
                         x.NgayHetHan > DateTime.UtcNow,
                    cancellationToken);

            if (daMoi)
            {
                throw new ApiException(
                    "Email này đã có lời mời đang chờ xác nhận.");
            }

            var invitation = new LoiMoiNhanSu
            {
                DoanhNghiepId = hs.DoanhNghiepId,
                NguoiDaiDienId = ndd.Id,
                Email = emailMoi,
                HoTen = hoTen,
                ChucVu = chucVu,
                Token = Guid.NewGuid().ToString("N"),
                LoiMoi = TrangThaiLoiMoi.ChoXacNhan,
                NgayHetHan = DateTime.UtcNow.AddDays(7)
            };

            await context.LoiMoiNhanSus.AddAsync(
                invitation,
                cancellationToken);

            await context.SaveChangesAsync(
                cancellationToken);

            var link = $"{request.Origin?.TrimEnd('/')}/accept-invite?token={invitation.Token}";

            await email.SendAsync(new EmailRequest
            {
                To = emailMoi,
                Subject = "Lời mời tham gia doanh nghiệp",
                Body = $"Bạn được mời trở thành nhân sự của doanh nghiệp. Nhấn vào liên kết sau để chấp nhận: {link}"
            });

            return new Response<string>(
                invitation.Token,
                "Đã gửi lời mời qua email.");
        }
    }
}
