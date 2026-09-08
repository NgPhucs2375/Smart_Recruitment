using Domain.Enums;
using System;

namespace Application.Features.LichPhongVan.Queries.GetAllLichPhongVans
{
    public class GetAllLichPhongVansViewModel
    {
        public int Id { get; set; }
        public int DonUngTuyenId { get; set; }
        public string DiaDiem { get; set; }
        public string GhiChu { get; set; }
        public HinhThucPhongVan HinhThuc { get; set; }
        public DateTime? ThoiGianPhongVan { get; set; }
        public TrangThaiLichPhongVan TrangThai { get; set; }
    }
}
