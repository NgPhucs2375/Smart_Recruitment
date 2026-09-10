using Domain.Enums;

namespace Application.DTOs.KetQuaPhanTichCv
{
    public class TaoKetQuaPhanTichCvDto
    {
        public int CVUngVienId { get; set; }

        public string NoiDungTrichXuat { get; set; }

        public string KyNangTrichXuat { get; set; }

        public string KinhNghiemTrichXuat { get; set; }

        public string HocVanTrichXuat { get; set; }

        public TrangThaiPhanTichAgent PhanTich { get; set; }
    }

    
}