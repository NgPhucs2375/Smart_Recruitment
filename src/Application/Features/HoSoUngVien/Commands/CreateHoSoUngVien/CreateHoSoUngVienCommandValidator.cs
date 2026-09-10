using FluentValidation;

namespace Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien
{
    public class CreateHoSoUngVienCommandValidator
        : AbstractValidator<CreateHoSoUngVienCommand>
    {
        public CreateHoSoUngVienCommandValidator()
        {
            RuleFor(x => x.NguoiDungId)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Người dùng không hợp lệ.");

            RuleFor(x => x.HoTen)
                .NotEmpty()
                .WithMessage("Họ tên là bắt buộc.")
                .MaximumLength(255)
                .WithMessage("Họ tên không được vượt quá 255 ký tự.");

            RuleFor(x => x.SDT)
                .MaximumLength(20)
                .WithMessage("Số điện thoại không được vượt quá 20 ký tự.")
                .Matches(@"^[0-9+\-\s]*$")
                .When(x => !string.IsNullOrWhiteSpace(x.SDT))
                .WithMessage("Số điện thoại không hợp lệ.");

            RuleFor(x => x.NgaySinh)
                .LessThan(DateTime.UtcNow.Date)
                .When(x => x.NgaySinh.HasValue)
                .WithMessage("Ngày sinh phải nhỏ hơn ngày hiện tại.");

            RuleFor(x => x.GioiTinh)
                .MaximumLength(10)
                .WithMessage("Giới tính không được vượt quá 10 ký tự.");

            RuleFor(x => x.DiaChi)
                .MaximumLength(255)
                .WithMessage("Địa chỉ không được vượt quá 255 ký tự.");

            RuleFor(x => x.GioiThieu)
                .MaximumLength(2000)
                .WithMessage("Giới thiệu không được vượt quá 2000 ký tự.");

            RuleFor(x => x.ViTriUngTuyen)
                .MaximumLength(200)
                .WithMessage("Vị trí ứng tuyển không được vượt quá 200 ký tự.");

            RuleFor(x => x.MucLuongMongMuon)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Mức lương mong muốn phải >= 0.");
        }
    }
}