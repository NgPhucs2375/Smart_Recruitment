using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DonUngTuyen.Queries.GetLichSuDonUngTuyen
{
    public class GetLichSuDonUngTuyenQuery : IRequest<Response<List<LichSuDonUngTuyenItem>>>
    {
        public int Id { get; set; }
    }

    public class LichSuDonUngTuyenItem
    {
        public int Id { get; set; }
        public TrangThaiDonUngTuyen TrangThaiTruoc { get; set; }
        public TrangThaiDonUngTuyen TrangThaiSau { get; set; }
        public TriggerDonUngTuyen? Trigger { get; set; }
        public int? NguoiThucHienId { get; set; }
        public string TenNguoiThucHien { get; set; }
        public string GhiChu { get; set; }
        public DateTime Created { get; set; }
    }

    /// <summary>
    /// Vệt kiểm toán trạng thái của một đơn, từ cũ nhất đến mới nhất.
    /// Quyền đọc y hệt quyền xem đơn (DonUngTuyenAccess).
    /// </summary>
    public class GetLichSuDonUngTuyenQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetLichSuDonUngTuyenQuery, Response<List<LichSuDonUngTuyenItem>>>
    {
        public async Task<Response<List<LichSuDonUngTuyenItem>>> Handle(
            GetLichSuDonUngTuyenQuery request,
            CancellationToken cancellationToken)
        {
            var don = await DonUngTuyenAccess.LoadReadableAsync(
                context, current, request.Id, cancellationToken);

            if (don == null)
                return new Response<List<LichSuDonUngTuyenItem>>("Không tìm thấy đơn ứng tuyển.");

            var rows = await context.LichSuTrangThaiDonUngTuyens
                .Where(h => h.DonUngTuyenId == don.Id)
                .OrderBy(h => h.Created)
                .ThenBy(h => h.Id)
                .Select(h => new
                {
                    h.Id,
                    h.TrangThaiTruoc,
                    h.TrangThaiSau,
                    h.Trigger,
                    h.NguoiThucHienId,
                    h.GhiChu,
                    h.Created
                })
                .ToListAsync(cancellationToken);

            var tenNguoiThucHien = await LoadActorNamesAsync(
                context, rows.Select(r => r.NguoiThucHienId).Where(x => x.HasValue).Select(x => x.Value).Distinct().ToList(),
                cancellationToken);

            return new Response<List<LichSuDonUngTuyenItem>>(rows.Select(r => new LichSuDonUngTuyenItem
            {
                Id = r.Id,
                TrangThaiTruoc = r.TrangThaiTruoc,
                TrangThaiSau = r.TrangThaiSau,
                Trigger = r.Trigger,
                NguoiThucHienId = r.NguoiThucHienId,
                TenNguoiThucHien = r.NguoiThucHienId.HasValue
                    ? tenNguoiThucHien.GetValueOrDefault(r.NguoiThucHienId.Value)
                    : null,
                GhiChu = r.GhiChu,
                Created = r.Created
            }).ToList());
        }

        private static async Task<Dictionary<int, string>> LoadActorNamesAsync(
            IApplicationDbContext context, List<int> nguoiDungIds, CancellationToken ct)
        {
            if (nguoiDungIds.Count == 0) return new Dictionary<int, string>();

            // Nhân sự có tên ở HoSoNhaTuyenDung, ứng viên ở HoSoUngVien -> lấy cả hai rồi hợp nhất.
            var rows = await context.NguoiDungs
                .Where(n => nguoiDungIds.Contains(n.Id))
                .Select(n => new
                {
                    n.Id,
                    TenUngVien = n.HoSoUngVien.HoTen,
                    TenNhaTuyenDung = n.HoSoNhaTuyenDung.HoTen
                })
                .ToListAsync(ct);

            return rows.ToDictionary(
                n => n.Id,
                n => !string.IsNullOrWhiteSpace(n.TenNhaTuyenDung) ? n.TenNhaTuyenDung : n.TenUngVien);
        }
    }
}
