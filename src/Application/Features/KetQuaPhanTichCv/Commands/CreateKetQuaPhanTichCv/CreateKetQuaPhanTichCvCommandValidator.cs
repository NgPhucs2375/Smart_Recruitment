using FluentValidation;
namespace Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;
public class CreateKetQuaPhanTichCvCommandValidator : AbstractValidator<CreateKetQuaPhanTichCvCommand> { public CreateKetQuaPhanTichCvCommandValidator() { RuleFor(x => x.CVUngVienId).GreaterThan(0); } }
