using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Stateless;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Services.StateMachineTinTuyenDung
{
    /// <summary>
    /// State machine cho tin tuyển dụng (1 cấp state <see cref="TrangThaiTinTuyenDung"/>).
    /// Luồng: Nhap -GuiDuyet-&gt; ChoDuyetHeThong -funnel-&gt; DangTuyen | ChoAdminDuyet -Admin-&gt; DangTuyen | TuChoi.
    /// DangTuyen/TamDung -Dong/HetHan/Khoa-&gt; DaDong/HetHan/BiKhoa (terminal).
    /// Tác nhân người: HR chủ tin / Người đại diện cùng công ty / Admin.
    /// Tác nhân hệ thống (funnel, job quét hạn): dùng <see cref="FireSystemAsync"/> (bypass auth).
    /// </summary>
    public class TinTuyenDungStateMachine
    {
        private readonly StateMachine<TrangThaiTinTuyenDung, TriggerTinTuyenDung> _machine;
        private readonly TinTuyenDung _entity;
        private readonly ITinTuyenDungWorkflowService _workflow;
        private readonly ICurrentNguoiDungService _current;

        private string _currentNote;
        private CancellationToken _currentCt;

        /// <summary>
        /// Các trigger chỉ hệ thống được fire (funnel kiểm duyệt, job quét hết hạn).
        /// </summary>
        public static bool LaTriggerHeThong(TriggerTinTuyenDung trigger)
            => trigger == TriggerTinTuyenDung.HeThongTuDongDuyet
            || trigger == TriggerTinTuyenDung.PhatHienNghiVan
            || trigger == TriggerTinTuyenDung.HeThongTuChoi
            || trigger == TriggerTinTuyenDung.HetHanNop;

        public TinTuyenDungStateMachine(
            ITinTuyenDungWorkflowService workflow,
            ICurrentNguoiDungService current,
            TinTuyenDung entity)
        {
            _entity = entity;
            _workflow = workflow;
            _current = current;

            _machine = new StateMachine<TrangThaiTinTuyenDung, TriggerTinTuyenDung>(
                () => _entity.TrangThai,
                s => _entity.TrangThai = s);

            ConfigureTransitions();
        }

        // hàm kiểm tra xem trigger có thể được fire hay không, không kiểm tra quyền
        public bool CanFire(TriggerTinTuyenDung trigger) => _machine.CanFire(trigger);

        public async Task<bool> CanFireAsync(TriggerTinTuyenDung trigger)
        {
            if (!_machine.CanFire(trigger))
                return false;
            try
            {
                await ValidateAuthorization(trigger);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Fire trigger có kiểm tra quyền (dành cho tác nhân người).
        /// Caller tự <c>SaveChangesAsync</c> sau khi fire thành công.
        /// </summary>
        public async Task FireAsync(TriggerTinTuyenDung trigger, string note = "", CancellationToken ct = default)
        {
            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi tin đang ở trạng thái '{_entity.TrangThai}'.");
            }

            await ValidateAuthorization(trigger);

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Fire trigger hệ thống, bỏ kiểm tra quyền (funnel kiểm duyệt, job quét hết hạn).
        /// Chỉ chấp nhận 4 trigger hệ thống, trigger của người sẽ bị từ chối.
        /// </summary>
        public async Task FireSystemAsync(TriggerTinTuyenDung trigger, string note = "", CancellationToken ct = default)
        {
            if (!LaTriggerHeThong(trigger))
                throw new ApiException($"Trigger '{trigger}' phải fire qua FireAsync (có kiểm tra quyền).");

            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi tin đang ở trạng thái '{_entity.TrangThai}'.");
            }

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Guard kiểm tra quyền trước khi cho phép fire trigger.
        /// </summary>
        private async Task ValidateAuthorization(TriggerTinTuyenDung trigger)
        {
            // Trigger hệ thống không đi đường này
            if (LaTriggerHeThong(trigger))
                throw new ApiException("Hành động này chỉ hệ thống được thực hiện.");

            var ctx = await _current.ResolveAsync();

            switch (trigger)
            {
                // Admin kiểm duyệt tay / cưỡng chế khóa
                case TriggerTinTuyenDung.AdminDuyet:
                case TriggerTinTuyenDung.AdminTuChoi:
                case TriggerTinTuyenDung.AdminCuongCheKhoa:
                    if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
                        throw new ApiException("Chỉ Quản trị viên được thực hiện hành động này.");
                    break;

                // HR thao tác tin: NguoiDaiDien theo công ty, NhanSu chỉ tin mình đăng
                case TriggerTinTuyenDung.GuiDuyet:
                case TriggerTinTuyenDung.TamDungTin:
                case TriggerTinTuyenDung.MoLaiTin:
                case TriggerTinTuyenDung.DongTin:
                    if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
                    {
                        if (_entity.DoanhNghiepId != ctx.DoanhNghiepId)
                            throw new ApiException("Bạn không có quyền xử lý tin của doanh nghiệp khác.", 403);
                    }
                    else if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
                    {
                        if (_entity.NguoiDangTinId != ctx.Id)
                            throw new ApiException("Bạn chỉ được xử lý tin do mình đăng.", 403);
                    }
                    else
                    {
                        throw new ApiException("Chỉ Nhân sự hoặc Người đại diện được thực hiện hành động này.");
                    }
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(trigger));
            }
        }

        /// <summary>
        /// Hook chạy sau mỗi transition — ghi thông báo / email / cascade đơn ứng tuyển.
        /// </summary>
        private async Task OnTransitedAsync(StateMachine<TrangThaiTinTuyenDung, TriggerTinTuyenDung>.Transition transition)
        {
            var trigger = transition.Trigger;
            await _workflow.HandleSideEffectsAsync(
                _entity,
                trigger,
                _currentNote ?? GetDefaultNote(trigger),
                _currentCt);
        }

        private void ConfigureTransitions()
        {
            // Nhap: soạn thảo, gửi duyệt vào funnel (nộp lại sau khi bị từ chối cũng về funnel)
            _machine.Configure(TrangThaiTinTuyenDung.Nhap)
                .Permit(TriggerTinTuyenDung.GuiDuyet, TrangThaiTinTuyenDung.ChoDuyetHeThong);

            // Funnel hệ thống: pass -> công khai | nghi vấn -> Admin | dính luật cứng -> từ chối
            _machine.Configure(TrangThaiTinTuyenDung.ChoDuyetHeThong)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerTinTuyenDung.HeThongTuDongDuyet, TrangThaiTinTuyenDung.DangTuyen)
                .Permit(TriggerTinTuyenDung.PhatHienNghiVan, TrangThaiTinTuyenDung.ChoAdminDuyet)
                .Permit(TriggerTinTuyenDung.HeThongTuChoi, TrangThaiTinTuyenDung.TuChoi);

            // Admin kiểm duyệt tay các tin vùng xám
            _machine.Configure(TrangThaiTinTuyenDung.ChoAdminDuyet)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerTinTuyenDung.AdminDuyet, TrangThaiTinTuyenDung.DangTuyen)
                .Permit(TriggerTinTuyenDung.AdminTuChoi, TrangThaiTinTuyenDung.TuChoi);

            // Đang tuyển: tạm dừng / đóng / hết hạn / bị khóa
            _machine.Configure(TrangThaiTinTuyenDung.DangTuyen)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerTinTuyenDung.TamDungTin, TrangThaiTinTuyenDung.TamDung)
                .Permit(TriggerTinTuyenDung.DongTin, TrangThaiTinTuyenDung.DaDong)
                .Permit(TriggerTinTuyenDung.HetHanNop, TrangThaiTinTuyenDung.HetHan)
                .Permit(TriggerTinTuyenDung.AdminCuongCheKhoa, TrangThaiTinTuyenDung.BiKhoa);

            // Tạm dừng: mở lại / đóng luôn / hết hạn khi đang dừng / bị khóa
            _machine.Configure(TrangThaiTinTuyenDung.TamDung)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerTinTuyenDung.MoLaiTin, TrangThaiTinTuyenDung.DangTuyen)
                .Permit(TriggerTinTuyenDung.DongTin, TrangThaiTinTuyenDung.DaDong)
                .Permit(TriggerTinTuyenDung.HetHanNop, TrangThaiTinTuyenDung.HetHan)
                .Permit(TriggerTinTuyenDung.AdminCuongCheKhoa, TrangThaiTinTuyenDung.BiKhoa);

            // Bị từ chối: HR sửa rồi gửi duyệt lại
            _machine.Configure(TrangThaiTinTuyenDung.TuChoi)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerTinTuyenDung.GuiDuyet, TrangThaiTinTuyenDung.ChoDuyetHeThong);

            // Terminal
            _machine.Configure(TrangThaiTinTuyenDung.HetHan).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiTinTuyenDung.DaDong).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiTinTuyenDung.BiKhoa).OnEntryAsync(OnTransitedAsync);
        }

        private static string GetDefaultNote(TriggerTinTuyenDung trigger) => trigger.ToString();
    }
}
