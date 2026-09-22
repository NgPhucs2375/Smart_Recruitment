using Application.Features.CVUngVien.Commands.ParseCvText;
using FluentValidation;

public class ParseCvTextCommandValidator
    : AbstractValidator<ParseCvTextCommand>
{
    public ParseCvTextCommandValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(x => x.RawText)
            .NotEmpty()
            .MinimumLength(20)
            .MaximumLength(200_000);

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .LessThanOrEqualTo(
                10 * 1024 * 1024);
    }
}