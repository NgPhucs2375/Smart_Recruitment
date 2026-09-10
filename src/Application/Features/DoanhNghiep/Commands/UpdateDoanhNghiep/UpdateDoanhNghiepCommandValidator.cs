using FluentValidation;

namespace Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;

public class UpdateDoanhNghiepCommandValidator : AbstractValidator<UpdateDoanhNghiepCommand>
{
    public UpdateDoanhNghiepCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.TenDoanhNghiep)
            .NotEmpty()
            .WithMessage("Tên doanh nghiệp không được để trống.")
            .MaximumLength(255)
            .WithMessage("Tên doanh nghiệp không được vượt quá 255 ký tự.");

        RuleFor(x => x.Website)
            .MaximumLength(255)
            .WithMessage("Website không được vượt quá 255 ký tự.");

        RuleFor(x => x.DiaChi)
            .MaximumLength(255)
            .WithMessage("Địa chỉ không được vượt quá 255 ký tự.");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500)
            .WithMessage("Logo không được vượt quá 500 ký tự.");

        RuleFor(x => x.MaSoThue)
            .MaximumLength(50)
            .WithMessage("Mã số thuế không được vượt quá 50 ký tự.");

        RuleFor(x => x.LinhVucHoatDong)
            .MaximumLength(255)
            .WithMessage("Lĩnh vực hoạt động không được vượt quá 255 ký tự.");

        RuleFor(x => x.QuyMoNhanSu)
            .MaximumLength(100)
            .WithMessage("Quy mô nhân sự không được vượt quá 100 ký tự.");
    }
}
