using Domain.Enums;

namespace Application.DTOs.KetQuaPhuHop
{
    public class TaoKetQuaPhuHopDto
    {
        public int HoSoUngVienId { get; set; }

        public int TinTuyenDungId { get; set; }

        public float DiemPhuHop { get; set; }

        public string KyNangThoa { get; set; }

        public string KyNangThieu { get; set; }

        public PhanLoaiKetQua PhanLoai { get; set; }

        public string GhiChu { get; set; }
    }
}