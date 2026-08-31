using FluentValidation;

namespace Application.Features.KetQuaPhuHop.Commads.UpdateKetQuaPhuHop
{
    public class UpdateKetQuaPhuHopCommandValidator : AbstractValidator<UpdateKetQuaPhuHopCommand>
    {
        public UpdateKetQuaPhuHopCommandValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.HoSoUngVienId).GreaterThan(0);
            RuleFor(x => x.TinTuyenDungId).GreaterThan(0);
            RuleFor(x => x.DiemPhuHop).GreaterThanOrEqualTo(0);
            RuleFor(x => x.PhanLoai).IsInEnum();
        }
    }
}
