using FluentValidation;

namespace Application.Features.KyNangTinTuyenDung.Commads.UpdateKyNangTinTuyenDung
{
    public class UpdateKyNangTinTuyenDungCommandValidator : AbstractValidator<UpdateKyNangTinTuyenDungCommand>
    {
        public UpdateKyNangTinTuyenDungCommandValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.TinTuyenDungId).GreaterThan(0);
            RuleFor(x => x.KyNangId).GreaterThan(0);
            RuleFor(x => x.MucDoYeuCau)
                .MaximumLength(50).WithMessage("Muc do yeu cau toi da 50 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.MucDoYeuCau));
        }
    }
}
