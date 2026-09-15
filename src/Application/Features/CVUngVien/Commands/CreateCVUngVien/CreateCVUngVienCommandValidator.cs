using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using FluentValidation;

namespace Application.Features.CVUngVien.Commands.CreateCVUngVien;

public class CreateCVUngVienCommandValidator : AbstractValidator<CreateCVUngVienCommand>
{
    public CreateCVUngVienCommandValidator()
    {
        RuleFor(x => x.HoSoUngVienId)
            .GreaterThan(0).WithMessage("Hồ sơ ứng viên không hợp lệ.");
        RuleFor(x => x.TenFile)
            .NotEmpty().WithMessage("Tên file không được để trống.")
            .MaximumLength(255).WithMessage("Tên file không được vượt quá 255 ký tự.");
        RuleFor(x => x.FileUrl)
            .MaximumLength(500).WithMessage("URL file không được vượt quá 500 ký tự.");
        RuleFor(x => x.TemplateId)
            .MaximumLength(100).WithMessage("Template không được vượt quá 100 ký tự.");
        RuleFor(x => x.PhuongThucTao)
            .IsInEnum().WithMessage("Phương thức tạo CV không hợp lệ.");
        RuleFor(x => x.NoiDung)
            .NotNull().WithMessage("Nội dung CV không được để trống.")
            .SetValidator(new ImportCvCommandValidator.ParsedCvDtoValidator());
    }
}
