using FluentValidation;

namespace Application.Features.KyNangTinTuyenDung.Commads.CreateKyNangTinTuyenDung
{
    public class CreateKyNangTinTuyenDungCommandValidator : AbstractValidator<CreateKyNangTinTuyenDungCommand>
    {
        public CreateKyNangTinTuyenDungCommandValidator()
        {
            RuleFor(x => x.TinTuyenDungId).GreaterThan(0);
            RuleFor(x => x.KyNangId).GreaterThan(0);
            RuleFor(x => x.MucDoYeuCau).IsInEnum().WithMessage("Muc do yeu cau khong hop le.");
        }
    }
}
