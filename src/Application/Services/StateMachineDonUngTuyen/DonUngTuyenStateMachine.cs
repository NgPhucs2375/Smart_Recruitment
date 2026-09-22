using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Stateless;
using System;
using System.Threading;
using System.Threading.Tasks;

using DonUngTuyen = Domain.Entities.DonUngTuyen;

namespace Application.Services.StateMachineDonUngTuyen
{
    /// <summary>
    /// State machine cho đơn ứng tuyển (1 cấp state <see cref="TrangThaiDonUngTuyen"/>).
    /// Luồng: KhoiTao -system-&gt; ChoXuLy -XemDon-&gt; DaXem -DanhGiaPhuHop-&gt; PhuHop,
    /// TuChoi ở mọi bước HR, RutDon của ứng viên, HetHanXuLy/DongBoiTinTuyenDung của hệ thống.
    /// Tác nhân người: HR (tin mình đăng / cùng công ty) + ứng viên nộp đơn.
    /// Tác nhân hệ thống: dùng <see cref="FireSystemAsync"/> (bypass auth).
    /// </summary>
    public class DonUngTuyenStateMachine
    {
        private readonly StateMachine<TrangThaiDonUngTuyen, TriggerDonUngTuyen> _machine;
        private readonly DonUngTuyen _entity;
        private readonly IDonUngTuyenWorkflowService _workflow;
        private readonly ICurrentNguoiDungService _current;

        private string _currentNote;
        private CancellationToken _currentCt;

        /// <summary>
        /// Các trigger chỉ hệ thống được fire (tiếp nhận hồ sơ, job SLA, cascade đóng tin).
        /// </summary>
        public static bool LaTriggerHeThong(TriggerDonUngTuyen trigger)
            => trigger == TriggerDonUngTuyen.XuLyHoSoThanhCong
            || trigger == TriggerDonUngTuyen.XuLyHoSoThatBai
            || trigger == TriggerDonUngTuyen.HetHanXuLy
            || trigger == TriggerDonUngTuyen.DongBoiTinTuyenDung;

        public DonUngTuyenStateMachine(
            IDonUngTuyenWorkflowService workflow,
            ICurrentNguoiDungService current,
            DonUngTuyen entity)
        {
            _entity = entity;
            _workflow = workflow;
            _current = current;

            _machine = new StateMachine<TrangThaiDonUngTuyen, TriggerDonUngTuyen>(
                () => _entity.TrangThai,
                s => _entity.TrangThai = s);

            ConfigureTransitions();
        }

        // hàm kiểm tra xem trigger có thể được fire hay không, không kiểm tra quyền
        public bool CanFire(TriggerDonUngTuyen trigger) => _machine.CanFire(trigger);

        public async Task<bool> CanFireAsync(TriggerDonUngTuyen trigger)
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
        /// Fire trigger có kiểm tra quyền (dành cho tác nhân người: HR / ứng viên).
        /// Caller tự <c>SaveChangesAsync</c> sau khi fire thành công.
        /// </summary>
        public async Task FireAsync(TriggerDonUngTuyen trigger, string note = "", CancellationToken ct = default)
        {
            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi đơn đang ở trạng thái '{_entity.TrangThai}'.");
            }

            await ValidateAuthorization(trigger);

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Fire trigger hệ thống, bỏ kiểm tra quyền (tiếp nhận hồ sơ, job SLA, cascade đóng tin).
        /// Chỉ chấp nhận 4 trigger hệ thống, trigger của người sẽ bị từ chối.
        /// </summary>
        public async Task FireSystemAsync(TriggerDonUngTuyen trigger, string note = "", CancellationToken ct = default)
        {
            if (!LaTriggerHeThong(trigger))
                throw new ApiException($"Trigger '{trigger}' phải fire qua FireAsync (có kiểm tra quyền).");

            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi đơn đang ở trạng thái '{_entity.TrangThai}'.");
            }

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Guard kiểm tra quyền trước khi cho phép fire trigger.
        /// </summary>
        private async Task ValidateAuthorization(TriggerDonUngTuyen trigger)
        {
            // Trigger hệ thống không đi đường này
            if (LaTriggerHeThong(trigger))
                throw new ApiException("Hành động này chỉ hệ thống được thực hiện.");

            var ctx = await _current.ResolveAsync();

            switch (trigger)
            {
                // Các hành động của Nhân sự / Người đại diện, chỉ áp dụng cho đơn thuộc tin họ đăng/tổ chức họ thuộc về
                case TriggerDonUngTuyen.XemDon:
                case TriggerDonUngTuyen.DanhGiaPhuHop:
                case TriggerDonUngTuyen.TuChoi:
                    if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
                    {
                        if (_entity.TinTuyenDung == null || _entity.TinTuyenDung.DoanhNghiepId != ctx.DoanhNghiepId)
                            throw new ApiException("Bạn không có quyền xử lý đơn ứng tuyển này.", 403);
                    }
                    else if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
                    {
                        if (_entity.TinTuyenDung == null || _entity.TinTuyenDung.NguoiDangTinId != ctx.Id)
                            throw new ApiException("Bạn chỉ được xử lý đơn thuộc tin do mình đăng.", 403);
                    }
                    else
                    {
                        throw new ApiException("Chỉ Nhân sự hoặc Người đại diện được thực hiện hành động này.");
                    }
                    break;

                // Chỉ ứng viên nộp đơn mới được rút / nộp lại hồ sơ
                case TriggerDonUngTuyen.RutDon:
                case TriggerDonUngTuyen.NopLaiHoSo:
                    if (ctx.VaiTro != VaiTroNguoiDung.UNG_VIEN)
                        throw new ApiException("Chỉ ứng viên mới được thực hiện hành động này.");
                    // Entity load kèm CVUngVien.HoSoUngVien thì đối chiếu NguoiDungId; nếu chưa Include navigation
                    // thì quyền sở hữu đã được kiểm tra ở command handler nên cho qua.
                    if (_entity.CVUngVien?.HoSoUngVien != null && _entity.CVUngVien.HoSoUngVien.NguoiDungId != ctx.Id)
                        throw new ApiException("Bạn không phải người nộp đơn này.", 403);
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(trigger));
            }
        }

        /// <summary>
        /// Hook chạy sau mỗi transition — ghi thông báo / email cho ứng viên.
        /// </summary>
        private async Task OnTransitedAsync(StateMachine<TrangThaiDonUngTuyen, TriggerDonUngTuyen>.Transition transition)
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
            // Tiếp nhận hệ thống: hồ sơ hợp lệ -> chờ xử lý | lỗi -> chờ nộp lại
            _machine.Configure(TrangThaiDonUngTuyen.KhoiTao)
                .Permit(TriggerDonUngTuyen.XuLyHoSoThanhCong, TrangThaiDonUngTuyen.ChoXuLy)
                .Permit(TriggerDonUngTuyen.XuLyHoSoThatBai, TrangThaiDonUngTuyen.LoiXuLyHoSo);

            // Lỗi hồ sơ: ứng viên nộp lại -> chờ xử lý
            _machine.Configure(TrangThaiDonUngTuyen.LoiXuLyHoSo)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.NopLaiHoSo, TrangThaiDonUngTuyen.ChoXuLy);

            // Chờ xử lý: HR xem / từ chối sớm, ứng viên rút, hết SLA, tin bị đóng
            _machine.Configure(TrangThaiDonUngTuyen.ChoXuLy)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.XemDon, TrangThaiDonUngTuyen.DaXem)
                .Permit(TriggerDonUngTuyen.TuChoi, TrangThaiDonUngTuyen.TuChoi)
                .Permit(TriggerDonUngTuyen.RutDon, TrangThaiDonUngTuyen.UngVienRutDon)
                .Permit(TriggerDonUngTuyen.HetHanXuLy, TrangThaiDonUngTuyen.QuaHanXuLy)
                .Permit(TriggerDonUngTuyen.DongBoiTinTuyenDung, TrangThaiDonUngTuyen.TinTuyenDungBiDong);

            // Đã xem: đánh giá phù hợp / từ chối / rút / hết hạn / tin đóng
            _machine.Configure(TrangThaiDonUngTuyen.DaXem)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.DanhGiaPhuHop, TrangThaiDonUngTuyen.PhuHop)
                .Permit(TriggerDonUngTuyen.TuChoi, TrangThaiDonUngTuyen.TuChoi)
                .Permit(TriggerDonUngTuyen.RutDon, TrangThaiDonUngTuyen.UngVienRutDon)
                .Permit(TriggerDonUngTuyen.HetHanXuLy, TrangThaiDonUngTuyen.QuaHanXuLy)
                .Permit(TriggerDonUngTuyen.DongBoiTinTuyenDung, TrangThaiDonUngTuyen.TinTuyenDungBiDong);

            // Phù hợp: từ chối sau đánh giá / rút / hết hạn / tin đóng
            _machine.Configure(TrangThaiDonUngTuyen.PhuHop)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.TuChoi, TrangThaiDonUngTuyen.TuChoi)
                .Permit(TriggerDonUngTuyen.RutDon, TrangThaiDonUngTuyen.UngVienRutDon)
                .Permit(TriggerDonUngTuyen.HetHanXuLy, TrangThaiDonUngTuyen.QuaHanXuLy)
                .Permit(TriggerDonUngTuyen.DongBoiTinTuyenDung, TrangThaiDonUngTuyen.TinTuyenDungBiDong);

            // Terminal
            _machine.Configure(TrangThaiDonUngTuyen.TuChoi).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiDonUngTuyen.UngVienRutDon).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiDonUngTuyen.QuaHanXuLy).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiDonUngTuyen.TinTuyenDungBiDong).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiDonUngTuyen.VoHieuHoa).OnEntryAsync(OnTransitedAsync);
        }

        private static string GetDefaultNote(TriggerDonUngTuyen trigger) => trigger.ToString();
    }
}
