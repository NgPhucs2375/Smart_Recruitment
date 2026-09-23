using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
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
        public PhuongThucLamViec PhuongThucLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public System.DateTime? NgayHetHan { get; set; }
    }

    public class UpdateTinTuyenDungCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        ITinTuyenDungWorkflowService workflow,
        ITinTuyenDungFunnelService funnel)
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

            // Tin đang tạm dừng được sửa; Người đại diện sẽ tự động đưa nội dung mới qua funnel.
            // Chuyển trạng thái (tạm dừng/đóng/mở lại...) bắt buộc qua FireTinTuyenDungTriggerCommand.
            if (entity.TrangThai != TrangThaiTinTuyenDung.Nhap &&
                entity.TrangThai != TrangThaiTinTuyenDung.TuChoi &&
                entity.TrangThai != TrangThaiTinTuyenDung.TamDung)
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
            entity.PhuongThucLamViec = request.PhuongThucLamViec;
            entity.LuongToiThieu = request.LuongToiThieu;
            entity.LuongToiDa = request.LuongToiDa;
            entity.NgayHetHan = request.NgayHetHan;

            string message = "Cập nhật tin tuyển dụng thành công.";
            // Sửa tin Nháp/Từ chối/Tạm dừng thì tự gửi duyệt lại qua funnel — áp dụng
            // cho cả Nhân sự và Người đại diện (funnel tự phân luồng theo người đăng:
            // nhân sự pass -> chờ Người đại diện duyệt, đại diện pass -> công khai).
            bool tuDongGuiDuyet = (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN ||
                    ctx.VaiTro == VaiTroNguoiDung.NHAN_SU) &&
                (entity.TrangThai == TrangThaiTinTuyenDung.Nhap ||
                 entity.TrangThai == TrangThaiTinTuyenDung.TuChoi ||
                 entity.TrangThai == TrangThaiTinTuyenDung.TamDung);

            if (tuDongGuiDuyet)
            {
                var machine = new TinTuyenDungStateMachine(workflow, current, entity);
                await machine.FireAsync(
                    TriggerTinTuyenDung.GuiDuyet,
                    ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                        ? "Người đại diện cập nhật tin, hệ thống tự động gửi kiểm duyệt."
                        : "Nhân sự cập nhật tin, hệ thống tự động gửi kiểm duyệt.",
                    cancellationToken);

                try
                {
                    var ketQua = await funnel.ChayAsync(entity, cancellationToken);
                    await machine.FireSystemAsync(ketQua.Trigger, ketQua.Note, cancellationToken);
                    message = ketQua.Trigger switch
                    {
                        TriggerTinTuyenDung.HeThongTuDongDuyet =>
                            $"Cập nhật thành công. Tin đã được duyệt tự động và đang công khai. ({ketQua.Note})",
                        TriggerTinTuyenDung.HeThongDuyetChoNguoiDaiDien =>
                            $"Cập nhật thành công. Tin đang chờ Người đại diện duyệt. ({ketQua.Note})",
                        TriggerTinTuyenDung.PhatHienNghiVan =>
                            $"Cập nhật thành công. Tin cần Admin kiểm tra. ({ketQua.Note})",
                        TriggerTinTuyenDung.HeThongTuChoi =>
                            $"Cập nhật thành công nhưng hệ thống từ chối: {ketQua.Note}",
                        _ => message
                    };
                }
                catch (System.Exception ex)
                {
                    await context.SaveChangesAsync(cancellationToken);
                    return new Response<int>(
                        data: entity.Id,
                        message: $"Tin đã tự động gửi duyệt nhưng sàng lọc gặp lỗi: {ex.Message}");
                }
            }

            await context.SaveChangesAsync(cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: message);
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
