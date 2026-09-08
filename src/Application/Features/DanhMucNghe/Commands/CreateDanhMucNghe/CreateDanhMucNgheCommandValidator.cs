using FluentValidation;
namespace Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;
public class CreateDanhMucNgheCommandValidator : AbstractValidator<CreateDanhMucNgheCommand> { 
    public CreateDanhMucNgheCommandValidator() { RuleFor(x => x.TenNghe).NotEmpty().MaximumLength(255); RuleFor(x => x.MoTa).MaximumLength(500); } }
