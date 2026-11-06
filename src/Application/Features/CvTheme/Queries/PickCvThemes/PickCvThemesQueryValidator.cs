using FluentValidation;

namespace Application.Features.CvTheme.Queries.PickCvThemes;

public class PickCvThemesQueryValidator : AbstractValidator<PickCvThemesQuery>
{
    public PickCvThemesQueryValidator()
    {
        RuleFor(x => x.Slugs).Must(x => x == null || x.Length is > 0 and <= 3)
            .WithMessage("Chọn 1 đến 3 mẫu từ danh mục.");
        RuleForEach(x => x.Slugs).MaximumLength(100);
        RuleFor(x => x.LyDo).Must(x => x == null || x.Length <= 3).WithMessage("Lý do tối đa 3 mục, tương ứng với danh sách mẫu.");
        RuleForEach(x => x.LyDo).MaximumLength(500);
        RuleFor(x => x.ViTri).MaximumLength(200);
        RuleFor(x => x.Nganh).MaximumLength(100);
        RuleFor(x => x.CapBac).MaximumLength(80);
        RuleFor(x => x.PhongCach).MaximumLength(100);
        RuleFor(x => x.KyNang).Must(x => x == null || x.Length <= 100).WithMessage("Tối đa 100 kỹ năng.");
        RuleForEach(x => x.KyNang).MaximumLength(100);
        RuleFor(x => x.NhanManh).Must(x => x == null || x.Length <= 3).WithMessage("Tối đa 3 phần nhấn mạnh.");
        RuleFor(x => x.SoCot).Must(x => !x.HasValue || x is 1 or 2).WithMessage("Số cột phải là 1 hoặc 2.");
    }
}
