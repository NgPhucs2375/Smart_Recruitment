using FluentValidation;

namespace Application.Features.KetQuaPhanTichCv.Commands.UpdateKetQuaPhanTichCv;

public class UpdateKetQuaPhanTichCvCommandValidator : AbstractValidator<UpdateKetQuaPhanTichCvCommand>
{
    public UpdateKetQuaPhanTichCvCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0);

        RuleFor(x => x.CVUngVienId)
            .GreaterThan(0);
    }
}