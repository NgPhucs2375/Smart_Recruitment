#nullable enable

namespace Application.Features.KetQuaPhuHop.Matching;

/// <summary>
/// Ghép chữ tự do sẵn có trên CV (giới thiệu bản thân, kinh nghiệm, dự án) thành một chuỗi
/// để matcher tìm bằng chứng kỹ năng không khai trong mục kỹ năng. Chỉ dùng làm đầu vào so
/// khớp: văn bản gốc vẫn hiển thị nguyên trên CV và không bị lưu lại dưới dạng đã ghép.
/// </summary>
public static class CandidateEvidenceText
{
    public static string From(Domain.Entities.CVUngVien cv)
    {
        var parts = new List<string>();
        void Add(string? value)
        {
            if (!string.IsNullOrWhiteSpace(value)) parts.Add(value);
        }

        Add(cv.ThongTinLienHe?.GioiThieuBanThan);
        foreach (var experience in cv.KinhNghiems)
        {
            Add(experience.ChucDanh);
            Add(experience.MoTa);
        }
        foreach (var project in cv.DuAns)
        {
            Add(project.TenDuAn);
            Add(project.VaiTro);
            Add(project.MoTa);
        }
        return string.Join('\n', parts);
    }
}
