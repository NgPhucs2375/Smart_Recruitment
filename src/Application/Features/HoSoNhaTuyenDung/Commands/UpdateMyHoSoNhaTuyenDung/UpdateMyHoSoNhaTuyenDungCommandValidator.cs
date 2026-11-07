using FluentValidation;
using Application.Validation;

namespace Application.Features.HoSoNhaTuyenDung.Commands.UpdateMyHoSoNhaTuyenDung;

public class UpdateMyHoSoNhaTuyenDungCommandValidator : AbstractValidator<UpdateMyHoSoNhaTuyenDungCommand>
{
    public UpdateMyHoSoNhaTuyenDungCommandValidator()
    {
        RuleFor(x => x.HoTen)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .MaximumLength(200).WithMessage("Họ tên tối đa 200 ký tự.");

        RuleFor(x => x.SDT)
            .MaximumLength(10).WithMessage("Số điện thoại phải gồm đúng 10 chữ số.")
            .Must(InputValidation.IsVietnameseMobilePhone).When(x => !string.IsNullOrWhiteSpace(x.SDT))
            .WithMessage("Số điện thoại không hợp lệ.");

        RuleFor(x => x.ChucVu)
            .MaximumLength(200).WithMessage("Chức vụ tối đa 200 ký tự.");
    }
}
