using AutoMapper;
using Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;
using Application.Features.KyNang.Queries.GetAllKyNangs;
using Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs;
using Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops;
using Domain.Entities;
using Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Features.DanhGia.Queries.GetAllDanhGias;
using Application.DTOs.HoSoUngVien;
using Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVien;
using Application.DTOs.DoanhNghiep;
using Application.Features.DoanhNghiep.Commands.CreateDoanhNghiep;
using Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;
using Application.DTOs.DanhMucNghe;
using Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;
using Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Commands.CreateCVUngVien;
using Application.Features.CVUngVien.Commands.UpdateCVUngVien;
using Application.DTOs.DonUngTuyen;
using Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.DTOs.KyNang;
using Application.Features.KyNang.Commands.CreateKyNang;
using Application.Features.KyNang.Commands.UpdateKyNang;
using Application.DTOs.KyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Commands.UpdateKyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Commands.CreateKyNangTinTuyenDung;
using Application.DTOs.KetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commands.UpdateKetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commands.CreateKetQuaPhuHop;
using Application.DTOs.KetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.UpdateKetQuaPhanTichCv;
using Application.DTOs.DanhGia;
using Application.Features.DanhGia.Commands.CreateDanhGia;
using Application.Features.DanhGia.Commands.UpdateDanhGia;
using Application.DTOs.HoSoNhaTuyenDung;
using Application.Features.HoSoNhaTuyenDung.Commands.UpdateHoSoNhaTuyenDung;


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
            CreateMap<HoSoUngVien, HoSoUngVienResponseDto>().ReverseMap();  
            CreateMap<TaoHoSoUngVienDto, CreateHoSoUngVienCommand>();
            CreateMap<CapNhatHoSoUngVienDto, UpdateHoSoUngVienCommand>();
            CreateMap<GetAllHoSoUngViensViewModel, HoSoUngVienResponseDto>();

            // NguoiDung
            CreateMap<NguoiDung, GetAllNguoiDungsViewModel>().ReverseMap();
            CreateMap<CreateNguoiDungCommand, NguoiDung>();
            CreateMap<GetAllNguoiDungsQuery, GetAllNguoiDungsParameter>();

            // HoSoNhaTuyenDung
            CreateMap<HoSoNhaTuyenDung, GetAllHoSoNhaTuyenDungsViewModel>().ReverseMap();
            CreateMap<CreateHoSoNhaTuyenDungCommand, HoSoNhaTuyenDung>();
            CreateMap<GetAllHoSoNhaTuyenDungsQuery, GetAllHoSoNhaTuyenDungsParameter>();
            CreateMap<TaoHoSoNhaTuyenDungDto, CreateHoSoNhaTuyenDungCommand>();
            CreateMap<CapNhatHoSoNhaTuyenDungDto, UpdateHoSoNhaTuyenDungCommand>();

            // KyNang
            CreateMap<KyNang,GetAllKyNangsViewModel>().ReverseMap();
            CreateMap<TaoKyNangDto, CreateKyNangCommand>();
            CreateMap<CapNhatKyNangDto, UpdateKyNangCommand>();

            // KyNangTinTuyenDung
            CreateMap<KyNangTinTuyenDung,GetAllKyNangTinTuyenDungsViewModel>().ReverseMap();
            CreateMap<TaoKyNangTinTuyenDungDto, CreateKyNangTinTuyenDungCommand>();
            CreateMap<CapNhatKyNangTinTuyenDungDto, UpdateKyNangTinTuyenDungCommand>();


            // KetQuaPhuHop
            CreateMap<KetQuaPhuHop,GetAllKetQuaPhuHopsViewModel>().ReverseMap();
            CreateMap<TaoKetQuaPhuHopDto, CreateKetQuaPhuHopCommand>();
            CreateMap<CapNhatKetQuaPhuHopDto, UpdateKetQuaPhuHopCommand>();

            // DanhMucNghe
            CreateMap<DanhMucNghe, GetAllDanhMucNghesViewModel>();
            CreateMap<TaoDanhMucNgheDto, CreateDanhMucNgheCommand>();
            CreateMap<CapNhatDanhMucNgheDto, UpdateDanhMucNgheCommand>();

            // DoanhNghiep
            CreateMap<DoanhNghiep, GetAllDoanhNghiepsViewModel>();
            CreateMap<TaoDoanhNghiepDto, CreateDoanhNghiepCommand>();
            CreateMap<CapNhatDoanhNghiepDto, UpdateDoanhNghiepCommand>();

            // CVUngVien
            CreateMap<CVUngVien, GetAllCVUngViensViewModel>();
            CreateMap<TaoCVUngVienDto, CreateCVUngVienCommand>();
            CreateMap<CapNhatCVUngVienDto, UpdateCVUngVienCommand>();

            CreateMap<DonUngTuyen, GetAllDonUngTuyensViewModel>()
                .ForMember(dest => dest.HoSoUngVienId, opt => opt.MapFrom(src => src.CVUngVien != null ? src.CVUngVien.HoSoUngVienId : 0));
            CreateMap<TaoDonUngTuyenDto, CreateDonUngTuyenCommand>();
            CreateMap<CapNhatDonUngTuyenDto, UpdateDonUngTuyenCommand>();

            // KetQuaPhanTichCv
            CreateMap<KetQuaPhanTichCv, GetAllKetQuaPhanTichCvsViewModel>();
            CreateMap<TaoKetQuaPhanTichCvDto, CreateKetQuaPhanTichCvCommand>();
            CreateMap<CapNhatKetQuaPhanTichCvDto, UpdateKetQuaPhanTichCvCommand>();

            // DanhGia
            CreateMap<DanhGia, GetAllDanhGiasViewModel>();
            CreateMap<TaoDanhGiaDto, CreateDanhGiaCommand>();
            CreateMap<CapNhatDanhGiaDto, UpdateDanhGiaCommand>();

        }
    }
}
