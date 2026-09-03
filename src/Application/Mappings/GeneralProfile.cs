using AutoMapper;
using Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Domain.Entities;
using Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Features.DanhGia.Queries.GetAllDanhGias;

namespace Application.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
            CreateMap<HoSoUngVien, GetAllHoSoUngViensViewModel>().ReverseMap();
            CreateMap<CreateHoSoUngVienCommand, HoSoUngVien>();
            CreateMap<GetAllHoSoUngViensQuery, GetAllHoSoUngViensParameter>();
            CreateMap<DanhMucNghe, GetAllDanhMucNghesViewModel>();
            CreateMap<DoanhNghiep, GetAllDoanhNghiepsViewModel>();
            CreateMap<CVUngVien, GetAllCVUngViensViewModel>();
            CreateMap<DonUngTuyen, GetAllDonUngTuyensViewModel>();
            CreateMap<KetQuaPhanTichCv, GetAllKetQuaPhanTichCvsViewModel>();
            CreateMap<DanhGia, GetAllDanhGiasViewModel>();
        }
    }
}
