using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Queries.GetTinTuyenDungById
{
    public class GetTinTuyenDungByIdQuery : IRequest<Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetTinTuyenDungByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetTinTuyenDungByIdQuery, Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>>
    {
        public async Task<Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>> Handle(
            GetTinTuyenDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.TinTuyenDungs
                .Include(t => t.DoanhNghiep)
                .Include(t => t.KyNangTinTuyenDungs)
                    .ThenInclude(k => k.KyNang)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>(
                    "Không tìm thấy tin tuyển dụng.");
            }

            var ctx = await current.ResolveAsync();

            var accessible = ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN
                ? entity.TrangThai == TrangThaiTinTuyenDung.DangTuyen
                : ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                    ? entity.DoanhNghiepId == ctx.DoanhNghiepId
                    : ctx.VaiTro == VaiTroNguoiDung.NHAN_SU &&
                      entity.NguoiDangTinId == ctx.Id;

            if (!accessible)
            {
                throw new ApiException(
                    "Bạn không có quyền xem tin tuyển dụng này.", 403);
            }

            var soLuongUngVien = await context.DonUngTuyens
                .AsNoTracking()
                .CountAsync(d => d.TinTuyenDungId == entity.Id, cancellationToken);

            var vm = new GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel
            {
                Id = entity.Id,
                DanhMucNgheId = entity.DanhMucNgheId,
                TieuDe = entity.TieuDe,
                MoTaCongViec = entity.MoTaCongViec,
                KinhNghiemYeuCau = entity.KinhNghiemYeuCau,
                YeuCauCongViec = entity.YeuCauCongViec,
                QuyenLoi = entity.QuyenLoi,
                DiaDiemLamViec = entity.DiaDiemLamViec,
                LuongToiThieu = entity.LuongToiThieu,
                LuongToiDa = entity.LuongToiDa,
                TrangThai = entity.TrangThai.ToString(),
                NgayHetHan = entity.NgayHetHan,
                NguoiDangTinId = entity.NguoiDangTinId,
                DoanhNghiepId = entity.DoanhNghiepId,
                TenDoanhNghiep = entity.DoanhNghiep?.TenDoanhNghiep,
                KyNangs = entity.KyNangTinTuyenDungs
                    .Select(k => k.KyNang.TenKyNang)
                    .ToList(),
                SoLuongUngVien = soLuongUngVien,
                Created = entity.Created,
                WorkMode = InferWorkMode(entity.DiaDiemLamViec, entity.MoTaCongViec),
                Level = InferLevel(entity.TieuDe, entity.KinhNghiemYeuCau),
                EmploymentType = InferEmploymentType(entity.YeuCauCongViec, entity.MoTaCongViec)
            };

            return new Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>(vm);
        }

        private static string InferWorkMode(string location, string description)
        {
            var value = $"{location} {description}".ToLower();
            if (value.Contains("remote") || value.Contains("từ xa") || value.Contains("online"))
                return "Remote";
            if (value.Contains("hybrid") || value.Contains("kết hợp") || value.Contains("linh hoạt"))
                return "Hybrid";
            return "Onsite";
        }

        private static string InferLevel(string title, string experience)
        {
            var value = $"{title} {experience}".ToLower();
            if (value.Contains("intern") || value.Contains("thực tập"))
                return "Intern";
            if (value.Contains("fresher") || value.Contains("mới tốt nghiệp"))
                return "Fresher";
            if (value.Contains("junior"))
                return "Junior";
            if (value.Contains("lead") || value.Contains("trưởng nhóm"))
                return "Lead";
            if (value.Contains("manager") || value.Contains("quản lý"))
                return "Manager";
            if (value.Contains("senior") || value.Contains("cao cấp"))
                return "Senior";
            return "Mid";
        }

        private static string InferEmploymentType(string requirements, string description)
        {
            var value = $"{requirements} {description}".ToLower();
            if (value.Contains("part-time") || value.Contains("bán thời gian") || value.Contains("part time"))
                return "Part-time";
            if (value.Contains("freelance") || value.Contains("tự do"))
                return "Freelance";
            if (value.Contains("contract") || value.Contains("hợp đồng"))
                return "Contract";
            return "Full-time";
        }
    }
}
