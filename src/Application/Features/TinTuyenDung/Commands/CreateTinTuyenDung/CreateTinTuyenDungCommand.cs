using Application.Exceptions;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
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
        ICurrentNguoiDungService current,
        ITinTuyenDungWorkflowService workflow,
        ITinTuyenDungFunnelService funnel)
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

            string message = "Tạo tin tuyển dụng thành công.";
            // Luồng duyệt khi đăng tin mới (áp dụng cho cả Nhân sự và Người đại diện):
            // - Nhân sự đăng: funnel hệ thống trước, pass -> chờ Người đại diện duyệt
            //   (HeThongDuyetChoNguoiDaiDien), vi phạm -> Admin (PhatHienNghiVan/TuChoi).
            // - Người đại diện đăng: chỉ qua auto-duyệt hệ thống, pass -> công khai
            //   (HeThongTuDongDuyet), vi phạm -> Admin quyết định tay.
            // Funnel tự phân luồng theo vai trò người đăng — handler chỉ kích hoạt chung.
            if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                || ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                var machine = new TinTuyenDungStateMachine(workflow, current, entity);
                try
                {
                    await machine.FireAsync(
                        TriggerTinTuyenDung.GuiDuyet,
                        ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                            ? "Người đại diện tạo tin, hệ thống tự động gửi kiểm duyệt."
                            : "Nhân sự tạo tin, hệ thống tự động gửi kiểm duyệt.",
                        cancellationToken);

                    var ketQua = await funnel.ChayAsync(entity, cancellationToken);
                    await machine.FireSystemAsync(ketQua.Trigger, ketQua.Note, cancellationToken);
                    message = ketQua.Trigger switch
                    {
                        TriggerTinTuyenDung.HeThongTuDongDuyet =>
                            $"Tạo tin thành công. Tin đã được duyệt tự động và đang công khai. ({ketQua.Note})",
                        TriggerTinTuyenDung.HeThongDuyetChoNguoiDaiDien =>
                            $"Tạo tin thành công. Tin đã qua kiểm duyệt hệ thống, đang chờ Người đại diện duyệt. ({ketQua.Note})",
                        TriggerTinTuyenDung.PhatHienNghiVan =>
                            $"Tạo tin thành công. Tin cần Admin kiểm tra. ({ketQua.Note})",
                        TriggerTinTuyenDung.HeThongTuChoi =>
                            $"Tạo tin thành công nhưng hệ thống từ chối: {ketQua.Note}",
                        _ => message
                    };
                }
                catch (ApiException ex)
                {
                    // Giữ tin ở Nháp (đã lưu ở trên) và báo rõ lý do + cách xử lý,
                    // thay vì văng exception để tin chết ở Nháp khó hiểu.
                    await context.SaveChangesAsync(cancellationToken);
                    return new Response<int>(
                        data: entity.Id,
                        message: $"Tin đã tạo ở trạng thái Nháp nhưng chưa gửi duyệt được: {ex.Message} Vui lòng bấm Gửi duyệt lại.");
                }
                catch (System.Exception ex)
                {
                    await context.SaveChangesAsync(cancellationToken);
                    return new Response<int>(
                        data: entity.Id,
                        message: $"Tin đã tự động gửi duyệt nhưng sàng lọc gặp lỗi: {ex.Message}");
                }

                await context.SaveChangesAsync(cancellationToken);
            }

            return new Response<int>(
                data: entity.Id,
                message: message);
        }
    }
}
