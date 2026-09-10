using FluentValidation;

namespace Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;

public class UpdateDonUngTuyenCommandValidator : AbstractValidator<UpdateDonUngTuyenCommand>
{
    public UpdateDonUngTuyenCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0);
    }
}