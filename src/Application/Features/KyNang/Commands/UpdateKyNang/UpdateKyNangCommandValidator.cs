using FluentValidation;

namespace Application.Features.KyNang.Commands.UpdateKyNang
{
    public class UpdateKyNangCommandValidator : AbstractValidator<UpdateKyNangCommand>
    {
    public UpdateKyNangCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

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
}
