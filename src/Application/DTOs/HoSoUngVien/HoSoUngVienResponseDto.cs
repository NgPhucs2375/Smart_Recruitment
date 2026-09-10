namespace Application.DTOs.HoSoUngVien
{
    /// <summary>
    /// DTO trả về cho GET hồ sơ ứng viên. Khớp 1-1 với Domain.Entities.HoSoUngVien.
    /// </summary>
    public class HoSoUngVienResponseDto
    {
        public int Id { get; set; }
        public int NguoiDungId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string GioiTinh { get; set; }
        public string DiaChi { get; set; }
        public string GioiThieu { get; set; }
        public string ViTriUngTuyen { get; set; }
        public double MucLuongMongMuon { get; set; }
        public bool IsTimViec { get; set; }
    }
}
