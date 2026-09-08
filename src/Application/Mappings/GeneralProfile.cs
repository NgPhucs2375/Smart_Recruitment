using AutoMapper;
using Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;
using Application.Features.KyNang.Queries.GetAllKyNangs;
using Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens;
using Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs;
using Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs;
using Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops;
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

            // KyNang
            CreateMap<KyNang,GetAllKyNangsViewModel>().ReverseMap();

            // KyNangUngVien
            CreateMap<KyNangUngVien,GetAllKyNangUngViensViewModel>().ReverseMap();

            // KyNangTinTuyenDung
            CreateMap<KyNangTinTuyenDung,GetAllKyNangTinTuyenDungsViewModel>().ReverseMap();

            // KinhNghiemLamViec
            CreateMap<KinhNghiemLamViec,GetAllKinhNghiemLamViecsViewModel>().ReverseMap();

            // KetQuaPhuHop
            CreateMap<KetQuaPhuHop,GetAllKetQuaPhuHopsViewModel>().ReverseMap();

            // DanhMucNghe
            CreateMap<DanhMucNghe, GetAllDanhMucNghesViewModel>();

            // DoanhNghiep
            CreateMap<DoanhNghiep, GetAllDoanhNghiepsViewModel>();

            // CVUngVien
            CreateMap<CVUngVien, GetAllCVUngViensViewModel>();

            // DonUngTuyen
            CreateMap<DonUngTuyen, GetAllDonUngTuyensViewModel>();

            // KetQuaPhanTichCv
            CreateMap<KetQuaPhanTichCv, GetAllKetQuaPhanTichCvsViewModel>();
            
            // DanhGia
            CreateMap<DanhGia, GetAllDanhGiasViewModel>();
        }
    }
}
