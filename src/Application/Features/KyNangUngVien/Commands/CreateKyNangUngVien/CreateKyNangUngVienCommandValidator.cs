using FluentValidation;

namespace Application.Features.KyNangUngVien.Commands.CreateKyNangUngVien;

public class CreateKyNangUngVienCommandValidator : AbstractValidator<CreateKyNangUngVienCommand>
{
    public CreateKyNangUngVienCommandValidator()
    {
        RuleFor(x => x.KyNangId)
            .GreaterThan(0).WithMessage("Vui lòng chọn kỹ năng.");

        RuleFor(x => x.SoNamKinhNghiem)
            .InclusiveBetween(0, 100).When(x => x.SoNamKinhNghiem.HasValue)
            .WithMessage("Số năm kinh nghiệm phải từ 0 đến 100.");
    }
}
