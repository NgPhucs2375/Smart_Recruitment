using FluentValidation;

namespace Application.Features.KinhNghiemLamViec.Commads.UpdateKinhNghiemLamViec
{
    public class UpdateKinhNghiemLamViecCommandValidator : AbstractValidator<UpdateKinhNghiemLamViecCommand>
    {
        public UpdateKinhNghiemLamViecCommandValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.HoSoUngVienId).GreaterThan(0);
            RuleFor(x => x.TenCongTy)
                .NotEmpty().WithMessage("Ten cong ty khong duoc de trong.")
                .MaximumLength(255).WithMessage("Ten cong ty toi da 255 ky tu.");
            RuleFor(x => x.DiaChi)
                .MaximumLength(500).WithMessage("Dia chi toi da 500 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.DiaChi));
            RuleFor(x => x.DenNgay)
                .GreaterThanOrEqualTo(x => x.TuNgay)
                .When(x => x.TuNgay.HasValue && x.DenNgay.HasValue && !x.IsHienTai)
                .WithMessage("Den ngay phai lon hon hoac bang tu ngay.");
        }
    }
}
