using FluentValidation;

namespace Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;

public class UpdateDanhMucNgheCommandValidator : AbstractValidator<UpdateDanhMucNgheCommand>
{
    public UpdateDanhMucNgheCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.TenNghe)
            .NotEmpty()
            .WithMessage("Tên ngành nghề không được để trống.")
            .MaximumLength(255)
            .WithMessage("Tên ngành nghề không được vượt quá 255 ký tự.");

        RuleFor(x => x.MoTa)
            .MaximumLength(500)
            .WithMessage("Mô tả không được vượt quá 500 ký tự.");
    }
}
