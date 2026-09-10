
namespace Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs
{
    public class GetAllKyNangTinTuyenDungsViewModel
    {
        public int Id { get; set; }
        public int TinTuyenDungId { get; set; }
        public int KyNangId { get; set; }
        public Domain.Enums.MucDoYC MucDoYeuCau { get; set; }
    }
}
