using FluentValidation;

namespace Application.Features.DanhGia.Commands.UpdateDanhGia;

public class UpdateDanhGiaCommandValidator : AbstractValidator<UpdateDanhGiaCommand>
{
    public UpdateDanhGiaCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.DonUngTuyenId)
            .GreaterThan(0)
            .WithMessage("Đơn ứng tuyển không hợp lệ.");

        RuleFor(x => x.NoiDungPhanHoi)
            .MaximumLength(4000)
            .WithMessage("Nội dung phản hồi không được vượt quá 4000 ký tự.");

        RuleFor(x => x.KetLuan)
            .MaximumLength(255)
            .WithMessage("Kết luận không được vượt quá 255 ký tự.");
    }
}
