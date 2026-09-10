using System;

namespace Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens
{
    public class GetAllHoSoUngViensViewModel
    {
        public int Id { get; set; }
        public int NguoiDungId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string GioiTinh { get; set; }
        public string DiaChi { get; set; }
        public string GioiThieu { get; set; }
    }
}
