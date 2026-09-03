using FluentValidation;

namespace Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;

public class CreateDonUngTuyenCommandValidator : AbstractValidator<CreateDonUngTuyenCommand>
{
    public CreateDonUngTuyenCommandValidator()
    {
        RuleFor(x => x.HoSoUngVienId)
            .GreaterThan(0);

        RuleFor(x => x.TinTuyenDungId)
            .GreaterThan(0);

        RuleFor(x => x.CVUngVienId)
            .GreaterThan(0);
    }
}