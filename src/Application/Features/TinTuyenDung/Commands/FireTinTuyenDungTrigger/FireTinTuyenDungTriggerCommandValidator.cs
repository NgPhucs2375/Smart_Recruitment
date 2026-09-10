using FluentValidation;

namespace Application.Features.TinTuyenDung.Commands.FireTinTuyenDungTrigger;

public class FireTinTuyenDungTriggerCommandValidator : AbstractValidator<FireTinTuyenDungTriggerCommand>
{
    public FireTinTuyenDungTriggerCommandValidator()
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
