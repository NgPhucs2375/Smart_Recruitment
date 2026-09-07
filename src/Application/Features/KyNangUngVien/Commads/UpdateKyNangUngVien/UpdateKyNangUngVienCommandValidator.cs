using FluentValidation;

namespace Application.Features.KyNangUngVien.Commads.UpdateKyNangUngVien
{
    public class UpdateKyNangUngVienCommandValidator : AbstractValidator<UpdateKyNangUngVienCommand>
    {
        public UpdateKyNangUngVienCommandValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.HoSoUngVienId).GreaterThan(0);
            RuleFor(x => x.KyNangId).GreaterThan(0);
            RuleFor(x => x.SoNamKinhNghiem)
                .GreaterThanOrEqualTo(0)
                .When(x => x.SoNamKinhNghiem.HasValue);
        }
    }
}
