using FluentValidation;

namespace Application.Features.KyNang.Commads.CreateKyNang
{
    public class CreateKyNangCommandValidator : AbstractValidator<CreateKyNangCommand>
    {
        public CreateKyNangCommandValidator()
        {
            RuleFor(x => x.TenKyNang)
                .NotEmpty().WithMessage("Ten ky nang khong duoc de trong.")
                .MaximumLength(255).WithMessage("Ten ky nang toi da 255 ky tu.");

            RuleFor(x => x.MoTa)
                .MaximumLength(500).WithMessage("Mo ta toi da 500 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.MoTa));
        }
    }
}
