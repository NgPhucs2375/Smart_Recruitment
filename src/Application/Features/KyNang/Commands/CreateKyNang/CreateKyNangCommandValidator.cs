using FluentValidation;

namespace Application.Features.KyNang.Commands.CreateKyNang;

public class CreateKyNangCommandValidator
    : AbstractValidator<CreateKyNangCommand>
{
    public CreateKyNangCommandValidator()
    {
        RuleFor(x => x.TenKyNang)
            .NotEmpty()
            .WithMessage("Tên kỹ năng không được để trống.")
            .MaximumLength(255)
            .WithMessage("Tên kỹ năng không được vượt quá 255 ký tự.");

        RuleFor(x => x.MoTa)
            .MaximumLength(500)
            .WithMessage("Mô tả không được vượt quá 500 ký tự.");
    }
}