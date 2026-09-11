using System.Collections.Generic;

namespace Application.DTOs.CV
{
    public class NoiDungCVDto
    {
        public ThongTinLienHeDTO ThongTinLienHe { get; set; }

        public List<HocVanDTO> HocVan { get; set; } = new();

        public List<KinhNghiemLamViecDTO> KinhNghiemLamViec { get; set; } = new();

        public List<DuAnDTO> DuAn { get; set; } = new();

        public List<KyNangDTO> KyNang { get; set; } = new();

        public List<ChungChiDTO> ChungChi { get; set; } = new();
    }
}
