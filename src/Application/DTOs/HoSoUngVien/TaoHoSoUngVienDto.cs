using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.HoSoUngVien
{
    /// <summary>
    /// Body POST api/hosoungviens. Map sang CreateHoSoUngVienCommand.
    /// </summary>
    public class TaoHoSoUngVienDto
    {
        [Required]
        public int NguoiDungId { get; set; }

        [Required(ErrorMessage = "Họ tên là bắt buộc.")]
        [MaxLength(200)]
        public string HoTen { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
        [MaxLength(20)]
        public string SDT { get; set; }

        public DateTime? NgaySinh { get; set; }

        [MaxLength(10)]
        public string GioiTinh { get; set; }

        [MaxLength(500)]
        public string DiaChi { get; set; }

        public string GioiThieu { get; set; }

        [MaxLength(200)]
        public string ViTriUngTuyen { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Mức lương mong muốn phải >= 0.")]
        public double MucLuongMongMuon { get; set; }

        public bool IsTimViec { get; set; } = true;
    }
}
