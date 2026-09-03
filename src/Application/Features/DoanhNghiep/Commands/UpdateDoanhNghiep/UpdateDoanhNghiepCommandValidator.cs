using FluentValidation;
namespace Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;
public class UpdateDoanhNghiepCommandValidator : AbstractValidator<UpdateDoanhNghiepCommand> { public UpdateDoanhNghiepCommandValidator() { RuleFor(x => x.TenDoanhNghiep).NotEmpty().MaximumLength(255); RuleFor(x => x.Website).MaximumLength(255); RuleFor(x => x.DiaChi).MaximumLength(255); RuleFor(x => x.LogoUrl).MaximumLength(500); } }
