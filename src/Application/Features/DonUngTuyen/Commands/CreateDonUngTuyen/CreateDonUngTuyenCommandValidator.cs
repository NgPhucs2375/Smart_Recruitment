using FluentValidation;

namespace Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;

public class CreateDonUngTuyenCommandValidator : AbstractValidator<CreateDonUngTuyenCommand>
{
    public CreateDonUngTuyenCommandValidator()
    {
        RuleFor(x => x.TinTuyenDungId)
            .GreaterThan(0)
            .WithMessage("Tin tuyển dụng không hợp lệ.");

        RuleFor(x => x.CVUngVienId)
            .GreaterThan(0)
            .WithMessage("CV ứng viên không hợp lệ.");
    }
}