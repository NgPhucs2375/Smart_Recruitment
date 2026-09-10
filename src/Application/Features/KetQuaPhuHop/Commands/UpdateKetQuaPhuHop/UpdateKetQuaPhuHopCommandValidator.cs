using FluentValidation;

namespace Application.Features.KetQuaPhuHop.Commands.UpdateKetQuaPhuHop
{
    public class UpdateKetQuaPhuHopCommandValidator : AbstractValidator<UpdateKetQuaPhuHopCommand>
    {
    public UpdateKetQuaPhuHopCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.HoSoUngVienId)
            .GreaterThan(0)
            .WithMessage("Hồ sơ ứng viên không hợp lệ.");

        RuleFor(x => x.TinTuyenDungId)
            .GreaterThan(0)
            .WithMessage("Tin tuyển dụng không hợp lệ.");

        RuleFor(x => x.DiemPhuHop)
            .InclusiveBetween(0, 100)
            .WithMessage("Điểm phù hợp phải nằm trong khoảng từ 0 đến 100.");

        RuleFor(x => x.PhanLoai)
            .IsInEnum()
            .WithMessage("Phân loại kết quả không hợp lệ.");
    }
    }
}
