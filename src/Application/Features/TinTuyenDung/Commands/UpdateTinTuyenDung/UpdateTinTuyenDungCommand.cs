using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Commands.UpdateTinTuyenDung
{
    public class UpdateTinTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int DanhMucNgheId { get; set; }
        public string TieuDe { get; set; }
        public string MoTaCongViec { get; set; }
        public string KinhNghiemYeuCau { get; set; }
        public string YeuCauCongViec { get; set; }
        public string QuyenLoi { get; set; }
        public string DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public System.DateTime? NgayHetHan { get; set; }
    }

    public class UpdateTinTuyenDungCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<UpdateTinTuyenDungCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            UpdateTinTuyenDungCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.TinTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy tin tuyển dụng.");
            }

            var ctx = await current.ResolveAsync();

            if (!CoTheThaoTac(ctx, entity))
            {
                throw new ApiException(
                    "Bạn không có quyền sửa tin tuyển dụng này.", 403);
            }

            // State machine: chỉ sửa nội dung khi tin còn Nhap hoặc bị TuChoi.
            // Chuyển trạng thái (tạm dừng/đóng/mở lại...) bắt buộc qua FireTinTuyenDungTriggerCommand.
            if (entity.TrangThai != TrangThaiTinTuyenDung.Nhap &&
                entity.TrangThai != TrangThaiTinTuyenDung.TuChoi)
            {
                throw new ApiException(
                    $"Không thể sửa nội dung khi tin đang ở trạng thái '{entity.TrangThai}'.");
            }

            var danhMucTonTai = await context.DanhMucNghes
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == request.DanhMucNgheId,
                    cancellationToken);

            if (!danhMucTonTai)
            {
                return new Response<int>(
                    "Không tìm thấy danh mục nghề.");
            }

            entity.DanhMucNgheId = request.DanhMucNgheId;
            entity.TieuDe = request.TieuDe?.Trim();
            entity.MoTaCongViec = request.MoTaCongViec?.Trim();
            entity.KinhNghiemYeuCau = request.KinhNghiemYeuCau?.Trim();
            entity.YeuCauCongViec = request.YeuCauCongViec?.Trim();
            entity.QuyenLoi = request.QuyenLoi?.Trim();
            entity.DiaDiemLamViec = request.DiaDiemLamViec?.Trim();
            entity.LuongToiThieu = request.LuongToiThieu;
            entity.LuongToiDa = request.LuongToiDa;
            entity.NgayHetHan = request.NgayHetHan;

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Cập nhật tin tuyển dụng thành công.");
        }

        private static bool CoTheThaoTac(CurrentNguoiDungContext ctx, Domain.Entities.TinTuyenDung t)
        {
            if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
                return t.DoanhNghiepId == ctx.DoanhNghiepId;
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
                return t.NguoiDangTinId == ctx.Id;
            return false;
        }
    }
}
