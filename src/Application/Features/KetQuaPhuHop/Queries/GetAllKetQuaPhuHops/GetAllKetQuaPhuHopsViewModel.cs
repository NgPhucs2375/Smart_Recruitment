using System;
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops
{
    public class GetAllKetQuaPhuHopsViewModel
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
        public float DiemPhuHop { get; set; }
        public PhanLoaiKetQua PhanLoai { get; set; }
        public DateTime Created { get; set; }
        public string HoTenUngVien { get; set; }
        public string TieuDeTinTuyenDung { get; set; }
    }
}
