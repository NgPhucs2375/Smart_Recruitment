using FluentValidation;

namespace Application.Features.HoSoNhaTuyenDung.Commands.UpdateHoSoNhaTuyenDung;

public class UpdateHoSoNhaTuyenDungCommandValidator : AbstractValidator<UpdateHoSoNhaTuyenDungCommand>
{
    public UpdateHoSoNhaTuyenDungCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.NguoiDungId)
            .GreaterThan(0)
            .WithMessage("Người dùng không hợp lệ.");

        RuleFor(x => x.DoanhNghiepId)
            .GreaterThan(0)
            .WithMessage("Doanh nghiệp không hợp lệ.");

        RuleFor(x => x.HoTen)
            .NotEmpty()
            .WithMessage("Họ tên không được để trống.")
            .MaximumLength(255)
            .WithMessage("Họ tên không được vượt quá 255 ký tự.");

        RuleFor(x => x.SDT)
            .MaximumLength(20)
            .WithMessage("Số điện thoại không được vượt quá 20 ký tự.")
            .Matches(@"^[0-9+\-\s]*$")
            .When(x => !string.IsNullOrWhiteSpace(x.SDT))
            .WithMessage("Số điện thoại không hợp lệ.");

        RuleFor(x => x.ChucVu)
            .NotEmpty()
            .WithMessage("Chức vụ không được để trống.")
            .MaximumLength(100)
            .WithMessage("Chức vụ không được vượt quá 100 ký tự.");
    }
}
