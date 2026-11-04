using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using KinhNghiemLamViecEntity = global::KinhNghiemLamViec;

namespace Application.Features.KinhNghiemLamViec.Commands.UpdateKinhNghiemLamViec;

public class UpdateKinhNghiemLamViecCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public string TenCongTy { get; set; }

    public string DiaChi { get; set; }

    public string TuNgay { get; set; }

    public string DenNgay { get; set; }

    public string MoTa { get; set; }

    public bool IsHienTai { get; set; }
}

public class UpdateKinhNghiemLamViecCommandValidator
    : AbstractValidator<UpdateKinhNghiemLamViecCommand>
{
    public UpdateKinhNghiemLamViecCommandValidator()
    {
        RuleFor(x => x.TenCongTy)
            .NotEmpty().WithMessage("Tên công ty không được để trống.")
            .MaximumLength(255).WithMessage("Tên công ty tối đa 255 ký tự.");

        RuleFor(x => x.DiaChi)
            .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự.");

        RuleFor(x => x.TuNgay)
            .Must(KinhNghiemNgay.CanBeParsed).WithMessage("Ngày bắt đầu không hợp lệ (dd/MM/yyyy hoặc yyyy-MM-dd).");

        RuleFor(x => x.DenNgay)
            .Must(KinhNghiemNgay.CanBeParsed).WithMessage("Ngày kết thúc không hợp lệ (dd/MM/yyyy hoặc yyyy-MM-dd).");
    }
}

public class UpdateKinhNghiemLamViecCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<UpdateKinhNghiemLamViecCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateKinhNghiemLamViecCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.KinhNghiemLamViecs
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy kinh nghiệm làm việc.");
        }

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.KinhNghiemLamViecs.Attach(entity);

        var ctx = await current.ResolveAsync();

        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
        {
            var laCuaMinh = await context.HoSoUngViens
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == entity.HoSoUngVienId && x.NguoiDungId == ctx.Id,
                    cancellationToken);
            if (!laCuaMinh)
            {
                return new Response<int>(
                    "Bạn không có quyền sửa kinh nghiệm này.");
            }
        }

        if (!KinhNghiemNgay.TryParse(request.TuNgay, out var tuNgay) ||
            !KinhNghiemNgay.TryParse(request.DenNgay, out var denNgay))
        {
            return new Response<int>(
                "Ngày không hợp lệ (dd/MM/yyyy hoặc yyyy-MM-dd).");
        }

        if (tuNgay.HasValue && denNgay.HasValue && denNgay < tuNgay)
        {
            return new Response<int>(
                "Ngày kết thúc phải sau ngày bắt đầu.");
        }

        entity.TenCongTy = request.TenCongTy.Trim();
        entity.DiaChi = string.IsNullOrWhiteSpace(request.DiaChi) ? null : request.DiaChi.Trim();
        entity.TuNgay = tuNgay;
        entity.DenNgay = request.IsHienTai ? null : denNgay;
        entity.MoTa = string.IsNullOrWhiteSpace(request.MoTa) ? null : request.MoTa.Trim();
        entity.IsHienTai = request.IsHienTai;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật kinh nghiệm thành công.");
    }
}
