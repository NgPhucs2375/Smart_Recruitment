using FluentValidation;

namespace Application.Features.TinTuyenDung.Commands.CreateTinTuyenDung;

public class CreateTinTuyenDungCommandValidator : AbstractValidator<CreateTinTuyenDungCommand>
{
    public CreateTinTuyenDungCommandValidator()
    {
        RuleFor(x => x.DanhMucNgheId)
            .GreaterThan(0)
            .WithMessage("Danh mục nghề không hợp lệ.");

        RuleFor(x => x.TieuDe)
            .NotEmpty()
            .WithMessage("Tiêu đề không được để trống.")
            .MaximumLength(255)
            .WithMessage("Tiêu đề không được vượt quá 255 ký tự.");

        RuleFor(x => x.MoTaCongViec)
            .NotEmpty()
            .WithMessage("Mô tả công việc không được để trống.");

        RuleFor(x => x.KinhNghiemYeuCau)
            .MaximumLength(2000)
            .WithMessage("Kinh nghiệm yêu cầu không được vượt quá 2000 ký tự.");

        RuleFor(x => x.YeuCauCongViec)
            .NotEmpty()
            .WithMessage("Yêu cầu công việc không được để trống.");

        RuleFor(x => x.QuyenLoi)
            .MaximumLength(2000)
            .WithMessage("Quyền lợi không được vượt quá 2000 ký tự.");

        RuleFor(x => x.DiaDiemLamViec)
            .NotEmpty()
            .WithMessage("Địa điểm làm việc không được để trống.")
            .MaximumLength(255)
            .WithMessage("Địa điểm làm việc không được vượt quá 255 ký tự.");

        RuleFor(x => x.LuongToiThieu)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Lương tối thiểu phải >= 0.");

        RuleFor(x => x.LuongToiDa)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Lương tối đa phải >= 0.");

        RuleFor(x => x)
            .Must(x => x.LuongToiDa >= x.LuongToiThieu)
            .WithMessage("Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.");

        RuleFor(x => x.NgayHetHan)
            .Must(ngay => !ngay.HasValue || ngay.Value.Date > DateTime.UtcNow.Date)
            .WithMessage("Ngày hết hạn phải sau ngày hiện tại.");
    }
}
