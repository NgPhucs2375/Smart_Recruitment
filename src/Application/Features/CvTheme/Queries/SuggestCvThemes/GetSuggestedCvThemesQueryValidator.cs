using FluentValidation;

namespace Application.Features.CvTheme.Queries.SuggestCvThemes;

public class GetSuggestedCvThemesQueryValidator : AbstractValidator<GetSuggestedCvThemesQuery>
{
    public GetSuggestedCvThemesQueryValidator()
    {
        RuleFor(x => x.ViTri).MaximumLength(200);
        RuleFor(x => x.Nganh).MaximumLength(100);
        RuleFor(x => x.CapBac).MaximumLength(80);
        RuleFor(x => x.PhongCach).MaximumLength(100);
        RuleFor(x => x.KyNang).Must(x => x == null || x.Length <= 100).WithMessage("Tối đa 100 kỹ năng.");
        RuleForEach(x => x.KyNang).MaximumLength(100);
        RuleFor(x => x.NhanManh).Must(x => x == null || x.Length <= 3).WithMessage("Tối đa 3 phần nhấn mạnh.");
        RuleForEach(x => x.NhanManh).Must(x => new[] { "projects", "experience", "skills", "education" }.Contains(x))
            .WithMessage("Phần nhấn mạnh: projects, experience, skills hoặc education.");
        RuleFor(x => x.SoCot).Must(x => !x.HasValue || x is 1 or 2).WithMessage("Số cột phải là 1 hoặc 2.");
    }
}
