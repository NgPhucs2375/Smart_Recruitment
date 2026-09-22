using FluentValidation;

namespace Application.Features.DanhGia.Commands.CreateDanhGia;

public class CreateDanhGiaCommandValidator : AbstractValidator<CreateDanhGiaCommand>
{
    public CreateDanhGiaCommandValidator()
    {
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
