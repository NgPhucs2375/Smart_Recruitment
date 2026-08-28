using Domain.Enums;

namespace Application.Features.ThongBao.Queries.GetAllThongBaos
{
    public class GetAllThongBaosViewModel
    {
        public int Id { get; set; }
        public int NguoiDungId { get; set; }
        public string TieuDe { get; set; }
        public string NoiDung { get; set; }
        public LoaiThongBao LoaiThongBao { get; set; }
        public bool IsRead { get; set; }
    }
}
