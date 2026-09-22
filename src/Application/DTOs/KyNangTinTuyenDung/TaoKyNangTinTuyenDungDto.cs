using Domain.Enums;

namespace Application.DTOs.KyNangTinTuyenDung
{
    public class TaoKyNangTinTuyenDungDto
    {
        public int TinTuyenDungId { get; set; }

        public int KyNangId { get; set; }

        public MucDoYC MucDoYeuCau { get; set; }
    }

}