using AutoMapper;
using Application.Features.HoSoUngVien.Commads.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;
using Application.Features.ThongBao.Queries.GetAllThongBaos;
using Application.Features.ThongBao.Commands.CreateThongBao;
using Domain.Entities;

namespace Application.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
            // HoSoUngVien
            CreateMap<HoSoUngVien, GetAllHoSoUngViensViewModel>().ReverseMap();
            CreateMap<CreateHoSoUngVienCommand, HoSoUngVien>();
            CreateMap<GetAllHoSoUngViensQuery, GetAllHoSoUngViensParameter>();

            // NguoiDung
            CreateMap<NguoiDung, GetAllNguoiDungsViewModel>().ReverseMap();
            CreateMap<CreateNguoiDungCommand, NguoiDung>();
            CreateMap<GetAllNguoiDungsQuery, GetAllNguoiDungsParameter>();

            // HoSoNhaTuyenDung
            CreateMap<HoSoNhaTuyenDung, GetAllHoSoNhaTuyenDungsViewModel>().ReverseMap();
            CreateMap<CreateHoSoNhaTuyenDungCommand, HoSoNhaTuyenDung>();
            CreateMap<GetAllHoSoNhaTuyenDungsQuery, GetAllHoSoNhaTuyenDungsParameter>();

            // ThongBao
            CreateMap<ThongBao, GetAllThongBaosViewModel>().ReverseMap();
            CreateMap<CreateThongBaoCommand, ThongBao>();
            CreateMap<GetAllThongBaosQuery, GetAllThongBaosParameter>();
        }
    }
}
