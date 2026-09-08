using FluentValidation;

namespace Application.Features.DanhGia.Commands.CreateDanhGia;

public class CreateDanhGiaCommandValidator : AbstractValidator<CreateDanhGiaCommand>
{
    public CreateDanhGiaCommandValidator()
    {
        RuleFor(x => x.DonUngTuyenId).GreaterThan(0);
        RuleFor(x => x.NoiDungPhanHoi).MaximumLength(4000);
        RuleFor(x => x.KetLuan).MaximumLength(255);
    }
}
