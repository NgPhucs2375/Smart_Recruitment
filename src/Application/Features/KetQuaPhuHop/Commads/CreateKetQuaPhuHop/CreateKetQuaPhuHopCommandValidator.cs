using FluentValidation;

namespace Application.Features.KetQuaPhuHop.Commads.CreateKetQuaPhuHop
{
    public class CreateKetQuaPhuHopCommandValidator : AbstractValidator<CreateKetQuaPhuHopCommand>
    {
        public CreateKetQuaPhuHopCommandValidator()
        {
            RuleFor(x => x.HoSoUngVienId).GreaterThan(0);
            RuleFor(x => x.TinTuyenDungId).GreaterThan(0);
            RuleFor(x => x.DiemPhuHop).GreaterThanOrEqualTo(0);
            RuleFor(x => x.PhanLoai).IsInEnum();
        }
    }
}
