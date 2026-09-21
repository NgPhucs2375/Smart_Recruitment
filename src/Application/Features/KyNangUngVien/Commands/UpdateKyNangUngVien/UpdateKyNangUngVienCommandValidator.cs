using FluentValidation;

namespace Application.Features.KyNangUngVien.Commands.UpdateKyNangUngVien;

public class UpdateKyNangUngVienCommandValidator : AbstractValidator<UpdateKyNangUngVienCommand>
{
    public UpdateKyNangUngVienCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("Thiếu id kỹ năng ứng viên.");

        RuleFor(x => x.KyNangId)
            .GreaterThan(0).WithMessage("Vui lòng chọn kỹ năng.");

        RuleFor(x => x.SoNamKinhNghiem)
            .InclusiveBetween(0, 100).When(x => x.SoNamKinhNghiem.HasValue)
            .WithMessage("Số năm kinh nghiệm phải từ 0 đến 100.");
    }
}
