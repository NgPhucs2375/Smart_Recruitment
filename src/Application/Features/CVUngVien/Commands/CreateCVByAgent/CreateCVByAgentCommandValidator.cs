using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using FluentValidation;

namespace Application.Features.CVUngVien.Commands.CreateCVByAgent;

public class CreateCVByAgentCommandValidator : AbstractValidator<CreateCVByAgentCommand>
{
    public CreateCVByAgentCommandValidator()
    {
        RuleFor(x => x.TenFile)
            .NotEmpty().WithMessage("Tên file không được để trống.")
            .MaximumLength(255).WithMessage("Tên file không được vượt quá 255 ký tự.");

        RuleFor(x => x.TemplateId)
            .MaximumLength(100).WithMessage("Template không được vượt quá 100 ký tự.");

        RuleFor(x => x.NoiDung)
            .NotNull().WithMessage("Nội dung CV không được để trống.")
            .SetValidator(new ImportCvCommandValidator.ParsedCvDtoValidator());
    }
}
