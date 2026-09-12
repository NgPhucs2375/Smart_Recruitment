using System.Text;
using Application.DTOs.CV;

namespace Application.Services.Retrieval;

public class CvSemanticDocumentBuilder
    : ICvSemanticDocumentBuilder
{
    public string Build(NoiDungCVDto cv)
    {
        ArgumentNullException.ThrowIfNull(cv);

        var sb = new StringBuilder();

        // ===== PROFILE =====

        if (cv.ThongTinLienHe != null)
        {
            Append(
                sb,
                "Vị trí ứng tuyển",
                cv.ThongTinLienHe.ViTriUngTuyen);

            Append(
                sb,
                "Giới thiệu",
                cv.ThongTinLienHe.GioiThieuBanThan);

            Append(
                sb,
                "Địa điểm",
                cv.ThongTinLienHe.DiaChi);
        }

        // ===== SKILLS =====

        if (cv.KyNang?.Count > 0)
        {
            sb.AppendLine("KỸ NĂNG:");

            foreach (var skill in cv.KyNang)
            {
                if (string.IsNullOrWhiteSpace(skill.TenKyNang))
                    continue;

                sb.Append($"- {skill.TenKyNang}");

                sb.Append(
                    $", mức độ: {skill.MucDoThanhThao}");

                if (skill.SoNamKinhNghiem.HasValue)
                {
                    sb.Append(
                        $", kinh nghiệm: {skill.SoNamKinhNghiem} năm");
                }

                sb.AppendLine();
            }

            sb.AppendLine();
        }

        // ===== WORK EXPERIENCE =====

        if (cv.KinhNghiemLamViec?.Count > 0)
        {
            sb.AppendLine("KINH NGHIỆM LÀM VIỆC:");

            foreach (var exp in cv.KinhNghiemLamViec)
            {
                sb.AppendLine(
                    $"- Chức danh: {exp.ChucDanh}");

                AppendIndented(
                    sb,
                    "Công ty",
                    exp.CongTy);

                if (exp.TuNgay.HasValue)
                {
                    var denNgay = exp.IsHienTai
                        ? "Hiện tại"
                        : exp.DenNgay?.ToString("MM/yyyy")
                          ?? "Không xác định";

                    sb.AppendLine(
                        $"  Thời gian: {exp.TuNgay:MM/yyyy} - {denNgay}");
                }

                AppendIndented(
                    sb,
                    "Mô tả",
                    exp.MoTa);

                if (exp.KyNangSuDung?.Count > 0)
                {
                    sb.AppendLine(
                        $"  Kỹ năng sử dụng: " +
                        string.Join(", ", exp.KyNangSuDung));
                }
            }

            sb.AppendLine();
        }

        // ===== PROJECTS =====

        if (cv.DuAn?.Count > 0)
        {
            sb.AppendLine("DỰ ÁN:");

            foreach (var project in cv.DuAn)
            {
                sb.AppendLine(
                    $"- {project.TenDuAn}");

                AppendIndented(
                    sb,
                    "Vai trò",
                    project.VaiTro);

                if (project.CongNghe?.Count > 0)
                {
                    sb.AppendLine(
                        $"  Công nghệ: " +
                        string.Join(", ", project.CongNghe));
                }

                AppendIndented(
                    sb,
                    "Mô tả",
                    project.MoTa);
            }

            sb.AppendLine();
        }

        // ===== EDUCATION =====

        if (cv.HocVan?.Count > 0)
        {
            sb.AppendLine("HỌC VẤN:");

            foreach (var education in cv.HocVan)
            {
                sb.AppendLine(
                    $"- Trường: {education.Truong}");

                AppendIndented(
                    sb,
                    "Chuyên ngành",
                    education.ChuyenNganh);

                AppendIndented(
                    sb,
                    "Mô tả",
                    education.MoTa);
            }

            sb.AppendLine();
        }

        // ===== CERTIFICATES =====

        if (cv.ChungChi?.Count > 0)
        {
            sb.AppendLine("CHỨNG CHỈ:");

            foreach (var certificate in cv.ChungChi)
            {
                sb.AppendLine(
                    $"- {certificate.TenChungChi}");

                AppendIndented(
                    sb,
                    "Đơn vị cấp",
                    certificate.DonViCap);
            }
        }

        return sb.ToString().Trim();
    }

    private static void Append(
        StringBuilder sb,
        string name,
        string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            sb.AppendLine($"{name}: {value}");
    }

    private static void AppendIndented(
        StringBuilder sb,
        string name,
        string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            sb.AppendLine($"  {name}: {value}");
    }
}