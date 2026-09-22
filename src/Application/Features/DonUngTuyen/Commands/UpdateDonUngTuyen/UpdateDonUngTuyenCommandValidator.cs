using FluentValidation;

namespace Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;

public class UpdateDonUngTuyenCommandValidator : AbstractValidator<UpdateDonUngTuyenCommand>
{
    public UpdateDonUngTuyenCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.Trigger)
            .IsInEnum()
            .WithMessage("Hành động không hợp lệ.");

        RuleFor(x => x.GhiChu)
            .MaximumLength(2000)
            .WithMessage("Ghi chú không được vượt quá 2000 ký tự.");
    }
}