using FluentValidation;

namespace Application.Features.KetQuaPhuHop.Commands.TinhDiemPhuHop;

public class TinhDiemPhuHopCommandValidator : AbstractValidator<TinhDiemPhuHopCommand>
{
    public TinhDiemPhuHopCommandValidator()
    {
        RuleFor(x => x.HoSoUngVienId)
            .GreaterThan(0)
            .WithMessage("Hồ sơ ứng viên không hợp lệ.");

        RuleFor(x => x.TinTuyenDungId)
            .GreaterThan(0)
            .WithMessage("Tin tuyển dụng không hợp lệ.");

        RuleFor(x => x.CVUngVienId)
            .GreaterThan(0)
            .When(x => x.CVUngVienId.HasValue)
            .WithMessage("CV ứng viên không hợp lệ.");
    }
}
