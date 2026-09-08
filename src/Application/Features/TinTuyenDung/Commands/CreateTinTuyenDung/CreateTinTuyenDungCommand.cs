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

    public class CreateTinTuyenDungCommandHandler : IRequestHandler<CreateTinTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;

        public CreateTinTuyenDungCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
        {
            _context = context;
            _current = current;
        }

        public async Task<Response<int>> Handle(CreateTinTuyenDungCommand r, CancellationToken ct)
        {
            var ctx = await _current.ResolveAsync();
            if (ctx.DoanhNghiepId == null)
                throw new ApiException("Bạn chưa thuộc doanh nghiệp nào.");

            var entity = new Domain.Entities.TinTuyenDung
            {
                DoanhNghiepId = ctx.DoanhNghiepId.Value,
                NguoiDangTinId = ctx.Id,
                DanhMucNgheId = r.DanhMucNgheId,
                TieuDe = r.TieuDe,
                MoTaCongViec = r.MoTaCongViec,
                KinhNghiemYeuCau = r.KinhNghiemYeuCau,
                YeuCauCongViec = r.YeuCauCongViec,
                QuyenLoi = r.QuyenLoi,
                DiaDiemLamViec = r.DiaDiemLamViec,
                LuongToiThieu = r.LuongToiThieu,
                LuongToiDa = r.LuongToiDa,
                // State machine: tin mới luôn bắt đầu ở Nhap, muốn công khai phải qua funnel (GuiDuyet)
                TrangThai = TrangThaiTinTuyenDung.Nhap,
                NgayHetHan = r.NgayHetHan
            };

            await _context.TinTuyenDungs.AddAsync(entity, ct);
            await _context.SaveChangesAsync(ct);
            return new Response<int>(entity.Id, "Tạo tin tuyển dụng thành công.");
        }
    }
}
