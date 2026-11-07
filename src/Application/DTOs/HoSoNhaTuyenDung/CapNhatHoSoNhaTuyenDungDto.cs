using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.HoSoNhaTuyenDung
{
    public class CapNhatHoSoNhaTuyenDungDto
    {
        public int Id { get; set; }

        public int DoanhNghiepId { get; set; }

        public string ChucVu { get; set; }

        public string GioiThieu { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
        [RegularExpression(@"^0(3|5|7|8|9)\d{8}$", ErrorMessage = "Số điện thoại di động VN không hợp lệ.")]
        [MaxLength(10)]
        public string SoDienThoai { get; set; }

        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        [MaxLength(100)]
        public string EmailLienHe { get; set; }
    }
}
