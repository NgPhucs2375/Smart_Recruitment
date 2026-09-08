using FluentValidation;
namespace Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;
public class UpdateDoanhNghiepCommandValidator : AbstractValidator<UpdateDoanhNghiepCommand> { public UpdateDoanhNghiepCommandValidator() { RuleFor(x => x.TenDoanhNghiep).NotEmpty().MaximumLength(255); RuleFor(x => x.Website).MaximumLength(255); RuleFor(x => x.DiaChi).MaximumLength(255); RuleFor(x => x.LogoUrl).MaximumLength(500); RuleFor(x => x.MaSoThue).MaximumLength(50); RuleFor(x => x.LinhVucHoatDong).MaximumLength(255); RuleFor(x => x.QuyMoNhanSu).MaximumLength(100); } }
