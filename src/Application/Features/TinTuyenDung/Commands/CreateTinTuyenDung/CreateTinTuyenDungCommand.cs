using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Commands.CreateTinTuyenDung
{
    public class CreateTinTuyenDungCommand : IRequest<Response<int>>
    {
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

    public class CreateTinTuyenDungCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<CreateTinTuyenDungCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            CreateTinTuyenDungCommand request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            if (ctx.DoanhNghiepId == null)
            {
                throw new ApiException(
                    "Bạn chưa thuộc doanh nghiệp nào.");
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

            var entity = new Domain.Entities.TinTuyenDung
            {
                DoanhNghiepId = ctx.DoanhNghiepId.Value,
                NguoiDangTinId = ctx.Id,
                DanhMucNgheId = request.DanhMucNgheId,
                TieuDe = request.TieuDe?.Trim(),
                MoTaCongViec = request.MoTaCongViec?.Trim(),
                KinhNghiemYeuCau = request.KinhNghiemYeuCau?.Trim(),
                YeuCauCongViec = request.YeuCauCongViec?.Trim(),
                QuyenLoi = request.QuyenLoi?.Trim(),
                DiaDiemLamViec = request.DiaDiemLamViec?.Trim(),
                LuongToiThieu = request.LuongToiThieu,
                LuongToiDa = request.LuongToiDa,
                // State machine: tin mới luôn bắt đầu ở Nhap, muốn công khai phải qua funnel (GuiDuyet)
                TrangThai = TrangThaiTinTuyenDung.Nhap,
                NgayHetHan = request.NgayHetHan
            };

            await context.TinTuyenDungs.AddAsync(
                entity,
                cancellationToken);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Tạo tin tuyển dụng thành công.");
        }
    }
}
