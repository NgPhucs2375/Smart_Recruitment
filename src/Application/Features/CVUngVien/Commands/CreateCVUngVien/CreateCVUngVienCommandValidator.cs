using FluentValidation;

namespace Application.Features.CVUngVien.Commands.CreateCVUngVien;

public class CreateCVUngVienCommandValidator : AbstractValidator<CreateCVUngVienCommand>
{
    public CreateCVUngVienCommandValidator()
    {
        RuleFor(x => x.HoSoUngVienId).GreaterThan(0);
        RuleFor(x => x.TenFile).NotEmpty().MaximumLength(255);
        RuleFor(x => x.FileUrl).NotEmpty().MaximumLength(500);
    }
}
