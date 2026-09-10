using FluentValidation;

namespace Application.Features.KyNangTinTuyenDung.Commands.UpdateKyNangTinTuyenDung
{
    public class UpdateKyNangTinTuyenDungCommandValidator : AbstractValidator<UpdateKyNangTinTuyenDungCommand>
    {
        public UpdateKyNangTinTuyenDungCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0)
                .WithMessage("Id không hợp lệ.");

            RuleFor(x => x.TinTuyenDungId)
                .GreaterThan(0)
                .WithMessage("Tin tuyển dụng không hợp lệ.");

            RuleFor(x => x.KyNangId)
                .GreaterThan(0)
                .WithMessage("Kỹ năng không hợp lệ.");

            RuleFor(x => x.MucDoYeuCau)
                .IsInEnum()
                .WithMessage("Mức độ yêu cầu không hợp lệ.");
        }
    }
}
