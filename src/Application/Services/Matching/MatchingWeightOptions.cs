namespace Application.Services.Matching;

/// <summary>
/// Trọng số tính điểm phù hợp giữa CV ứng viên và tin tuyển dụng.
/// Tổng 3 nhóm = 1.0. Có thể override khi đăng ký DI.
/// </summary>
public class MatchingWeightOptions
{
    public double SkillWeight { get; set; } = 0.60;

    public double ExperienceWeight { get; set; } = 0.25;

    public double EducationWeight { get; set; } = 0.15;

    /// <summary>Trọng số 1 kỹ năng theo MucDoYC của tin.</summary>
    public double TrongSoBatBuoc { get; set; } = 3.0;

    public double TrongSoUuTien { get; set; } = 1.5;

    public double TrongSoKhongBatBuoc { get; set; } = 0.5;

    /// <summary>Tỉ lệ điểm cứng khi khớp tên kỹ năng (phần còn lại theo MucDoThanhThao).</summary>
    public double TyLeDiemCoBanKhiKhop { get; set; } = 0.7;

    /// <summary>Số năm kinh nghiệm đạt điểm tối đa khi tin không ghi rõ số năm.</summary>
    public double SoNamKinhNghiemToiDa { get; set; } = 5.0;

    /// <summary>Ngưỡng phân loại điểm 0-100.</summary>
    public double NguongCao { get; set; } = 80.0;

    public double NguongTrungBinh { get; set; } = 50.0;
}
