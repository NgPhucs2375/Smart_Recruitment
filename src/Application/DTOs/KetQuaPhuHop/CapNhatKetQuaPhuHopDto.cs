using Domain.Enums;

namespace Application.DTOs.DanhMucNghe
{
public class CapNhatKetQuaPhuHopDto
    {
        public int Id { get; set; }

        public float DiemPhuHop { get; set; }

        public string KyNangThoa { get; set; }

        public string KyNangThieu { get; set; }

        public PhanLoaiKetQua PhanLoai { get; set; }

        public string GhiChu { get; set; }
    }
}