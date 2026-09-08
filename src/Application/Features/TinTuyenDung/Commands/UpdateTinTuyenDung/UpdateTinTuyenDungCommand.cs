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
        public TrangThaiTinTuyenDung TrangThai { get; set; }
        public System.DateTime? NgayHetHan { get; set; }
    }

    public class UpdateTinTuyenDungCommandHandler : IRequestHandler<UpdateTinTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;

        public UpdateTinTuyenDungCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
        {
            _context = context;
            _current = current;
        }

        public async Task<Response<int>> Handle(UpdateTinTuyenDungCommand r, CancellationToken ct)
        {
            var entity = await _context.TinTuyenDungs.FindAsync(r.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy tin tuyển dụng.");

            var ctx = await _current.ResolveAsync();
            if (!CoTheThaoTac(ctx, entity))
                throw new ApiException("Bạn không có quyền sửa tin tuyển dụng này.", 403);

            entity.DanhMucNgheId = r.DanhMucNgheId;
            entity.TieuDe = r.TieuDe;
            entity.MoTaCongViec = r.MoTaCongViec;
            entity.KinhNghiemYeuCau = r.KinhNghiemYeuCau;
            entity.YeuCauCongViec = r.YeuCauCongViec;
            entity.QuyenLoi = r.QuyenLoi;
            entity.DiaDiemLamViec = r.DiaDiemLamViec;
            entity.LuongToiThieu = r.LuongToiThieu;
            entity.LuongToiDa = r.LuongToiDa;
            entity.TrangThai = r.TrangThai;
            entity.NgayHetHan = r.NgayHetHan;

            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Cập nhật tin tuyển dụng thành công.");
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
