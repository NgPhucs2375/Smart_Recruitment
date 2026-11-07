using FluentValidation;
using Application.Validation;

namespace Application.Features.NhanSu.Commands.InviteNhanSu;

public class InviteNhanSuCommandValidator : AbstractValidator<InviteNhanSuCommand>
{
    public InviteNhanSuCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email không được để trống.")
            .Must(InputValidation.IsEmail)
            .WithMessage("Email không hợp lệ.")
            .MaximumLength(100)
            .WithMessage("Email không được vượt quá 100 ký tự.");

        RuleFor(x => x.HoTen)
            .MaximumLength(255)
            .WithMessage("Họ tên không được vượt quá 255 ký tự.");

        RuleFor(x => x.ChucVu)
            .MaximumLength(255)
            .WithMessage("Chức vụ không được vượt quá 255 ký tự.");

        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin không được để trống.");
    }
}
