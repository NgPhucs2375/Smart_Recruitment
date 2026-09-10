using FluentValidation;

namespace Application.Features.CVUngVien.Commands.UpdateCVUngVien;

public class UpdateCVUngVienCommandValidator : AbstractValidator<UpdateCVUngVienCommand>
{
    public UpdateCVUngVienCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0)
            .WithMessage("Id không hợp lệ.");

        RuleFor(x => x.TenFile)
            .MaximumLength(255)
            .WithMessage("Tên file không được vượt quá 255 ký tự.");

        RuleFor(x => x.TemplateId)
            .MaximumLength(50)
            .WithMessage("Template không được vượt quá 50 ký tự.");

        RuleFor(x => x.NoiDung)
            .NotNull().WithMessage("Nội dung CV không được để trống.");

        When(x => x.NoiDung != null, () =>
        {
            RuleFor(x => x.NoiDung.ThongTinLienHe.HoTen)
                .NotEmpty()
                .WithMessage("Họ tên liên hệ không được để trống.")
                .MaximumLength(255)
                .WithMessage("Họ tên liên hệ không được vượt quá 255 ký tự.");
            RuleFor(x => x.NoiDung.ThongTinLienHe.Email)
                .NotEmpty()
                .WithMessage("Email liên hệ không được để trống.")
                .EmailAddress()
                .WithMessage("Email liên hệ không hợp lệ.")
                .MaximumLength(255)
                .WithMessage("Email liên hệ không được vượt quá 255 ký tự.");
            RuleFor(x => x.NoiDung.ThongTinLienHe.SDT)
                .NotEmpty()
                .WithMessage("Số điện thoại liên hệ không được để trống.")
                .MaximumLength(20)
                .WithMessage("Số điện thoại liên hệ không được vượt quá 20 ký tự.");

            RuleFor(x => x)
                .Must(x => (x.NoiDung.KinhNghiemLamViec?.Count ?? 0)
                    + (x.NoiDung.HocVan?.Count ?? 0) > 0)
                .WithMessage("CV phải có ít nhất một mục kinh nghiệm làm việc hoặc học vấn.");

            RuleForEach(x => x.NoiDung.KinhNghiemLamViec).ChildRules(kn =>
            {
                kn.RuleFor(k => k.CongTy)
                    .NotEmpty()
                    .WithMessage("Tên công ty không được để trống.")
                    .MaximumLength(255)
                    .WithMessage("Tên công ty không được vượt quá 255 ký tự.");
                kn.RuleFor(k => k.ChucDanh)
                    .NotEmpty()
                    .WithMessage("Chức danh không được để trống.")
                    .MaximumLength(255)
                    .WithMessage("Chức danh không được vượt quá 255 ký tự.");
            });

            RuleForEach(x => x.NoiDung.HocVan).ChildRules(hv =>
            {
                hv.RuleFor(h => h.Truong)
                    .NotEmpty()
                    .WithMessage("Tên trường không được để trống.")
                    .MaximumLength(255)
                    .WithMessage("Tên trường không được vượt quá 255 ký tự.");
            });

            RuleForEach(x => x.NoiDung.KyNang).ChildRules(kn =>
            {
                kn.RuleFor(k => k.TenKyNang)
                    .NotEmpty()
                    .WithMessage("Tên kỹ năng không được để trống.")
                    .MaximumLength(255)
                    .WithMessage("Tên kỹ năng không được vượt quá 255 ký tự.");
            });
        });
    }
}
