using FluentValidation;

namespace Application.Features.NguoiDung.Commands.CreateNguoiDung;

public class CreateNguoiDungCommandValidator : AbstractValidator<CreateNguoiDungCommand>
{
    public CreateNguoiDungCommandValidator()
    {
        RuleFor(x => x.ApplicationUserId)
            .NotEmpty()
            .WithMessage("Mã người dùng ứng dụng không được để trống.")
            .MaximumLength(450)
            .WithMessage("Mã người dùng ứng dụng không được vượt quá 450 ký tự.");

        RuleFor(x => x.VaiTro)
            .IsInEnum()
            .WithMessage("Vai trò người dùng không hợp lệ.");
    }
}