// using AutoMapper;
// using Application.Features.Products.Commands.CreateProduct;
// using Application.Features.Products.Queries.GetAllProducts;
// using Domain.Entities;
// using System;
// using System.Collections.Generic;
// using System.Text;

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
namespace Application.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
            CreateMap<HoSoUngVien, GetAllHoSoUngViensViewModel>().ReverseMap();
            CreateMap<CreateHoSoUngVienCommand, HoSoUngVien>();
            CreateMap<GetAllHoSoUngViensQuery, GetAllHoSoUngViensParameter>();

            CreateMap<Domain.Entities.KyNang, Application.Features.KyNang.Queries.GetAllKyNangs.GetAllKyNangsViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KyNangUngVien, Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KyNangTinTuyenDung, Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KinhNghiemLamViec, Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>().ReverseMap();
            CreateMap<Domain.Entities.KetQuaPhuHop, Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>().ReverseMap();
        }
    }
}
>>>>>>> Stashed changes
