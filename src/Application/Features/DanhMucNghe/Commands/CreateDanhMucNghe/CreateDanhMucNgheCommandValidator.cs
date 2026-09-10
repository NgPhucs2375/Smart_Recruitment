using FluentValidation;

namespace Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;

public class CreateDanhMucNgheCommandValidator
    : AbstractValidator<CreateDanhMucNgheCommand>
{
    public CreateDanhMucNgheCommandValidator()
    {
        RuleFor(x => x.TenNghe)
            .NotEmpty()
            .WithMessage("Tên ngành nghề không được để trống.")
            .MaximumLength(255)
            .WithMessage(
                "Tên ngành nghề không được vượt quá 255 ký tự.");

        RuleFor(x => x.MoTa)
            .MaximumLength(500)
            .WithMessage(
                "Mô tả không được vượt quá 500 ký tự.");
    }
}