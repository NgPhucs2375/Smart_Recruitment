using FluentValidation;

namespace Application.Features.KyNangUngVien.Commads.CreateKyNangUngVien
{
    public class CreateKyNangUngVienCommandValidator : AbstractValidator<CreateKyNangUngVienCommand>
    {
        public CreateKyNangUngVienCommandValidator()
        {
            RuleFor(x => x.HoSoUngVienId).GreaterThan(0);
            RuleFor(x => x.KyNangId).GreaterThan(0);
            RuleFor(x => x.SoNamKinhNghiem)
                .GreaterThanOrEqualTo(0)
                .When(x => x.SoNamKinhNghiem.HasValue);
        }
    }
}
