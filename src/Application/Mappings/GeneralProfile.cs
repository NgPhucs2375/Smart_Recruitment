using AutoMapper;
using Application.Features.HoSoUngVien.Commads.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;
using Application.Features.ThongBao.Queries.GetAllThongBaos;
using Application.Features.ThongBao.Commands.CreateThongBao;
using Application.Features.LichPhongVan.Queries.GetAllLichPhongVans;
using Application.Features.LichPhongVan.Commands.CreateLichPhongVan;
using Domain.Entities;

<<<<<<< HEAD
<<<<<<< Updated upstream
// namespace Application.Mappings
// {
//     public class GeneralProfile : Profile
//     {
//         public GeneralProfile()
//         {
//             CreateMap<Product, GetAllProductsViewModel>().ReverseMap();
//             CreateMap<CreateProductCommand, Product>();
//             CreateMap<GetAllProductsQuery, GetAllProductsParameter>();
//         }
//     }
// }
=======
=======
>>>>>>> 5b8f0c9db6de3dc161c4c7d2733044d833f36890
namespace Application.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
<<<<<<< HEAD
=======
            // HoSoUngVien
>>>>>>> 5b8f0c9db6de3dc161c4c7d2733044d833f36890
            CreateMap<HoSoUngVien, GetAllHoSoUngViensViewModel>().ReverseMap();
            CreateMap<CreateHoSoUngVienCommand, HoSoUngVien>();
            CreateMap<GetAllHoSoUngViensQuery, GetAllHoSoUngViensParameter>();

<<<<<<< HEAD
            CreateMap<Domain.Entities.KyNang, Application.Features.KyNang.Queries.GetAllKyNangs.GetAllKyNangsViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KyNangUngVien, Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KyNangTinTuyenDung, Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KinhNghiemLamViec, Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KetQuaPhuHop, Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>().ReverseMap();
        }
    }
}
>>>>>>> Stashed changes
=======
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

            // LichPhongVan
            CreateMap<LichPhongVan, GetAllLichPhongVansViewModel>().ReverseMap();
            CreateMap<CreateLichPhongVanCommand, LichPhongVan>();
            CreateMap<GetAllLichPhongVansQuery, GetAllLichPhongVansParameter>();
        }
    }
}
>>>>>>> 5b8f0c9db6de3dc161c4c7d2733044d833f36890
