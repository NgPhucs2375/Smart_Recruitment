using AutoMapper;
using Application.Features.HoSoUngVien.Commads.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Domain.Entities;

namespace Application.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
            CreateMap<HoSoUngVien, GetAllHoSoUngViensViewModel>().ReverseMap();
            CreateMap<CreateHoSoUngVienCommand, HoSoUngVien>();
            CreateMap<GetAllHoSoUngViensQuery, GetAllHoSoUngViensParameter>();
        }
    }
}
