using FluentValidation;
namespace Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;
public class UpdateDanhMucNgheCommandValidator : AbstractValidator<UpdateDanhMucNgheCommand> { public UpdateDanhMucNgheCommandValidator() { RuleFor(x => x.TenNghe).NotEmpty().MaximumLength(255); RuleFor(x => x.MoTa).MaximumLength(500); } }
