using Application.Services.StateMachineTinTuyenDung;
using FluentValidation;

namespace Application.Features.TinTuyenDung.Commands.UpdateTinTuyenDung;

public class UpdateTinTuyenDungCommandValidator : JobDraftValidator<UpdateTinTuyenDungCommand>
{
    public UpdateTinTuyenDungCommandValidator() { RuleFor(x => x.Id).GreaterThan(0); }
}
