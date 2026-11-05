using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using KinhNghiemLamViecEntity = global::KinhNghiemLamViec;

namespace Application.Features.KinhNghiemLamViec.Commands.CreateKinhNghiemLamViec;

public class CreateKinhNghiemLamViecCommand : IRequest<Response<int>>
{
    public string TenCongTy { get; set; }

    public string DiaChi { get; set; }

    public string TuNgay { get; set; }

    public string DenNgay { get; set; }

    public string MoTa { get; set; }

    public bool IsHienTai { get; set; }

    /// <summary>Hồ sơ đích. null = hồ sơ của chính user đang đăng nhập.</summary>
    public int? HoSoUngVienId { get; set; }
}

public class CreateKinhNghiemLamViecCommandValidator
    : AbstractValidator<CreateKinhNghiemLamViecCommand>
{
    public CreateKinhNghiemLamViecCommandValidator()
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

public class CreateKinhNghiemLamViecCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateKinhNghiemLamViecCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKinhNghiemLamViecCommand request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        var hoSoId = request.HoSoUngVienId;
        if (!hoSoId.HasValue)
        {
            hoSoId = await context.HoSoUngViens
                .AsNoTracking()
                .Where(x => x.NguoiDungId == ctx.Id)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (hoSoId == 0)
            {
                return new Response<int>(
                    "Bạn chưa có hồ sơ ứng viên.");
            }
        }
        else if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
        {
            var laCuaMinh = await context.HoSoUngViens
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == hoSoId.Value && x.NguoiDungId == ctx.Id,
                    cancellationToken);
            if (!laCuaMinh)
            {
                return new Response<int>(
                    "Bạn không có quyền thêm kinh nghiệm cho hồ sơ này.");
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

        var entity = new KinhNghiemLamViecEntity
        {
            HoSoUngVienId = hoSoId.Value,
            TenCongTy = request.TenCongTy.Trim(),
            DiaChi = string.IsNullOrWhiteSpace(request.DiaChi) ? null : request.DiaChi.Trim(),
            TuNgay = tuNgay,
            DenNgay = request.IsHienTai ? null : denNgay,
            MoTa = string.IsNullOrWhiteSpace(request.MoTa) ? null : request.MoTa.Trim(),
            IsHienTai = request.IsHienTai
        };

        await context.KinhNghiemLamViecs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Thêm kinh nghiệm thành công.");
    }
}
