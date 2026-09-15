using Application.DTOs.CV;
using FluentValidation;

namespace Application.Features.CVUngVien.Commands.ImportCvUngVien;

public class ImportCvCommandValidator : AbstractValidator<ImportCvCommand>
{
    private const string DatePattern =
        @"^(?:(?:0[1-9]|[12]\d|3[01])/(?:0[1-9]|1[0-2])/\d{4}|(?:0[1-9]|1[0-2])/\d{4})$";

    public ImportCvCommandValidator()
    {
        RuleFor(x => x.TenFile)
            .NotEmpty().WithMessage("Tên file không được để trống.")
            .MaximumLength(255).WithMessage("Tên file không được vượt quá 255 ký tự.");
        RuleFor(x => x.FileUrl)
            .MaximumLength(500).WithMessage("URL file không được vượt quá 500 ký tự.");
        RuleFor(x => x.TemplateId)
            .MaximumLength(100).WithMessage("Template không được vượt quá 100 ký tự.");
        RuleFor(x => x.NoiDung)
            .NotNull().WithMessage("Nội dung CV không được để trống.")
            .SetValidator(new ParsedCvDtoValidator());
    }

    internal sealed class ParsedCvDtoValidator : AbstractValidator<ParsedCvDto>
    {
        public ParsedCvDtoValidator()
        {
            RuleFor(x => x.ThongTinLienHe)
                .NotNull().WithMessage("Thông tin liên hệ không được để trống.")
                .SetValidator(new ThongTinLienHeValidator());

            ValidateCollection(x => x.HocVan, new HocVanValidator(), "Học vấn");
            ValidateCollection(x => x.KinhNghiemLamViec, new KinhNghiemValidator(), "Kinh nghiệm");
            ValidateCollection(x => x.DuAn, new DuAnValidator(), "Dự án");
            ValidateCollection(x => x.KyNang, new KyNangValidator(), "Kỹ năng");
            ValidateCollection(x => x.ChungChi, new ChungChiValidator(), "Chứng chỉ");
        }

        private void ValidateCollection<T>(
            System.Linq.Expressions.Expression<Func<ParsedCvDto, IEnumerable<T>>> expression,
            IValidator<T> validator,
            string name)
        {
            RuleFor(expression)
                .NotNull().WithMessage($"Danh sách {name.ToLowerInvariant()} không được null.")
                .Must(x => x == null || x.Count() <= 100)
                .WithMessage($"Danh sách {name.ToLowerInvariant()} không được vượt quá 100 mục.");
            RuleForEach(expression).SetValidator(validator);
        }
    }

    private sealed class ThongTinLienHeValidator : AbstractValidator<ParsedThongTinLienHeDto>
    {
        public ThongTinLienHeValidator()
        {
            RuleFor(x => x.HoTen)
                .NotEmpty().WithMessage("Họ tên không được để trống.")
                .MaximumLength(255).WithMessage("Họ tên không được vượt quá 255 ký tự.");
            RuleFor(x => x.Email)
                .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("Email không hợp lệ.")
                .MaximumLength(256).WithMessage("Email không được vượt quá 256 ký tự.");
            RuleFor(x => x.SDT)
                .Matches(@"^\+?[0-9]{8,15}$").When(x => !string.IsNullOrWhiteSpace(x.SDT))
                .WithMessage("Số điện thoại chỉ gồm 8-15 chữ số và có thể bắt đầu bằng dấu +.")
                .MaximumLength(20).WithMessage("Số điện thoại không được vượt quá 20 ký tự.");
            RuleFor(x => x.DiaChi).MaximumLength(500);
            RuleFor(x => x.GitHub).MaximumLength(500);
            RuleFor(x => x.LinkedIn).MaximumLength(500);
            RuleFor(x => x.Portfolio).MaximumLength(500);
            RuleFor(x => x.GioiTinh).MaximumLength(20);
            RuleFor(x => x.ViTriUngTuyen).MaximumLength(255);
            RuleFor(x => x.AnhDaiDienUrl).MaximumLength(500);
            RuleFor(x => x.MucLuongMongMuon)
                .GreaterThanOrEqualTo(0).When(x => x.MucLuongMongMuon.HasValue)
                .WithMessage("Mức lương mong muốn không được âm.");
            ValidateDate(RuleFor(x => x.NgaySinh), "Ngày sinh");
        }
    }

    private sealed class HocVanValidator : AbstractValidator<ParsedHocVanDto>
    {
        public HocVanValidator()
        {
            RuleFor(x => x.Truong)
                .NotEmpty().WithMessage("Tên trường không được để trống.")
                .MaximumLength(255).WithMessage("Tên trường không được vượt quá 255 ký tự.");
            RuleFor(x => x.ChuyenNganh).MaximumLength(255);
            RuleFor(x => x.BangCap).MaximumLength(255);
            ValidatePeriod(this, x => x.TuNgay, x => x.DenNgay, x => x.IsHienTai, "học vấn");
        }
    }

    private sealed class KinhNghiemValidator : AbstractValidator<ParsedKinhNghiemDto>
    {
        public KinhNghiemValidator()
        {
            RuleFor(x => x.TenCongTy)
                .NotEmpty().WithMessage("Tên công ty không được để trống.")
                .MaximumLength(255).WithMessage("Tên công ty không được vượt quá 255 ký tự.");
            RuleFor(x => x.ChucDanh)
                .NotEmpty().WithMessage("Chức danh không được để trống.")
                .MaximumLength(255).WithMessage("Chức danh không được vượt quá 255 ký tự.");
            RuleFor(x => x.DiaChi).MaximumLength(500);
            RuleFor(x => x.KyNangSuDung)
                .NotNull().WithMessage("Danh sách kỹ năng sử dụng không được null.")
                .Must(x => x == null || x.Count <= 50)
                .WithMessage("Danh sách kỹ năng sử dụng không được vượt quá 50 mục.");
            RuleForEach(x => x.KyNangSuDung).SetValidator(new KyNangThamChieuValidator());
            ValidatePeriod(this, x => x.TuNgay, x => x.DenNgay, x => x.IsHienTai, "kinh nghiệm");
        }
    }

    private sealed class DuAnValidator : AbstractValidator<ParsedDuAnDto>
    {
        public DuAnValidator()
        {
            RuleFor(x => x.TenDuAn)
                .NotEmpty().WithMessage("Tên dự án không được để trống.")
                .MaximumLength(255).WithMessage("Tên dự án không được vượt quá 255 ký tự.");
            RuleFor(x => x.VaiTro).MaximumLength(255);
            RuleFor(x => x.Link).MaximumLength(500);
            RuleFor(x => x.CongNghe)
                .NotNull().WithMessage("Danh sách công nghệ không được null.")
                .Must(x => x == null || x.Count <= 50)
                .WithMessage("Danh sách công nghệ không được vượt quá 50 mục.");
            RuleForEach(x => x.CongNghe).SetValidator(new KyNangThamChieuValidator());
            ValidatePeriod(this, x => x.TuNgay, x => x.DenNgay, x => x.IsHienTai, "dự án");
        }
    }

    private sealed class KyNangValidator : AbstractValidator<ParsedKyNangDto>
    {
        public KyNangValidator()
        {
            RuleFor(x => x.KyNangId)
                .GreaterThan(0).When(x => x.KyNangId.HasValue)
                .WithMessage("ID kỹ năng phải lớn hơn 0.");
            RuleFor(x => x.TenKyNang)
                .NotEmpty().WithMessage("Tên kỹ năng không được để trống.")
                .MaximumLength(255).WithMessage("Tên kỹ năng không được vượt quá 255 ký tự.");
            RuleFor(x => x.MucDoThanhThao)
                .IsInEnum().When(x => x.MucDoThanhThao.HasValue)
                .WithMessage("Mức độ thành thạo không hợp lệ.");
            RuleFor(x => x.SoNamKinhNghiem)
                .InclusiveBetween(0, 100).When(x => x.SoNamKinhNghiem.HasValue)
                .WithMessage("Số năm kinh nghiệm phải từ 0 đến 100.");
        }
    }

    private sealed class KyNangThamChieuValidator : AbstractValidator<ParsedKyNangThamChieuDto>
    {
        public KyNangThamChieuValidator()
        {
            RuleFor(x => x.KyNangId)
                .GreaterThan(0).When(x => x.KyNangId.HasValue)
                .WithMessage("ID kỹ năng phải lớn hơn 0.");
            RuleFor(x => x.TenKyNang)
                .NotEmpty().WithMessage("Tên kỹ năng tham chiếu không được để trống.")
                .MaximumLength(255).WithMessage("Tên kỹ năng tham chiếu không được vượt quá 255 ký tự.");
        }
    }

    private sealed class ChungChiValidator : AbstractValidator<ParsedChungChiDto>
    {
        public ChungChiValidator()
        {
            RuleFor(x => x.TenChungChi)
                .NotEmpty().WithMessage("Tên chứng chỉ không được để trống.")
                .MaximumLength(255).WithMessage("Tên chứng chỉ không được vượt quá 255 ký tự.");
            RuleFor(x => x.DonViCap).MaximumLength(255);
            RuleFor(x => x.MaXacMinh).MaximumLength(255);
            RuleFor(x => x.CredentialUrl).MaximumLength(500);
            ValidateDate(RuleFor(x => x.NgayCap), "Ngày cấp");
            ValidateDate(RuleFor(x => x.NgayHetHan), "Ngày hết hạn");
            RuleFor(x => x)
                .Must(x => IsChronological(x.NgayCap, x.NgayHetHan))
                .WithMessage("Ngày hết hạn chứng chỉ phải từ ngày cấp trở đi.");
        }
    }

    private static void ValidateDate<T>(IRuleBuilderInitial<T, string?> rule, string fieldName)
    {
        rule.Matches(DatePattern)
            .WithMessage($"{fieldName} phải đúng định dạng dd/MM/yyyy hoặc MM/yyyy.")
            .Must(CvImportDateParser.IsValid)
            .WithMessage($"{fieldName} không phải ngày hợp lệ.");
    }

    private static void ValidatePeriod<T>(
        AbstractValidator<T> validator,
        System.Linq.Expressions.Expression<Func<T, string?>> from,
        System.Linq.Expressions.Expression<Func<T, string?>> to,
        System.Linq.Expressions.Expression<Func<T, bool>> isCurrent,
        string section)
    {
        ValidateDate(validator.RuleFor(from), "Từ ngày");
        ValidateDate(validator.RuleFor(to), "Đến ngày");
        validator.RuleFor(to)
            .Empty().When(isCurrent.Compile())
            .WithMessage($"Đến ngày của {section} phải để trống khi đang hiện tại.");
        validator.RuleFor(x => x)
            .Must(x => IsChronological(from.Compile()(x), to.Compile()(x)))
            .WithMessage($"Đến ngày của {section} phải từ ngày bắt đầu trở đi.");
    }

    private static bool IsChronological(string? from, string? to)
    {
        if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to) ||
            !CvImportDateParser.IsValid(from) || !CvImportDateParser.IsValid(to))
        {
            return true;
        }

        return CvImportDateParser.ParseDate(to) >= CvImportDateParser.ParseDate(from);
    }
}
