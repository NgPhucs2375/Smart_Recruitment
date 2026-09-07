using FluentValidation;

namespace Application.Features.KyNang.Commads.UpdateKyNang
{
    public class UpdateKyNangCommandValidator : AbstractValidator<UpdateKyNangCommand>
    {
        public UpdateKyNangCommandValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.TenKyNang)
                .NotEmpty().WithMessage("Ten ky nang khong duoc de trong.")
                .MaximumLength(255).WithMessage("Ten ky nang toi da 255 ky tu.");
            RuleFor(x => x.MoTa)
                .MaximumLength(500).WithMessage("Mo ta toi da 500 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.MoTa));
        }
    }
}
