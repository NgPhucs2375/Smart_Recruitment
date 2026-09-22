using FluentValidation;

namespace Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;

public class CreateKetQuaPhanTichCvCommandValidator
    : AbstractValidator<CreateKetQuaPhanTichCvCommand>
{
    public CreateKetQuaPhanTichCvCommandValidator()
    {
        RuleFor(x => x.CVUngVienId)
            .GreaterThan(0)
            .WithMessage("CV không hợp lệ.");

        RuleFor(x => x.NoiDungTrichXuat)
            .NotEmpty()
            .WithMessage(
                "Nội dung trích xuất không được để trống.");

        RuleFor(x => x.KyNangTrichXuat)
            .MaximumLength(10000)
            .WithMessage("Kỹ năng trích xuất không được vượt quá 10000 ký tự.");

        RuleFor(x => x.KinhNghiemTrichXuat)
            .MaximumLength(20000)
            .WithMessage("Kinh nghiệm trích xuất không được vượt quá 20000 ký tự.");
    }
}