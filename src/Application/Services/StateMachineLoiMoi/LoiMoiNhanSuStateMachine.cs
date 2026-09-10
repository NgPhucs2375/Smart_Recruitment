using Application.Exceptions;
using Domain.Entities;
using Domain.Enums;
using Stateless;
using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
namespace Application.Services.StateMachineLoiMoi
{
    public class LoiMoiNhanSuStateMachine
    {
        private readonly StateMachine<TrangThaiLoiMoi,TriggerLoiMoi> _machine;
        private readonly LoiMoiNhanSu _entity;
        private readonly ILoiMoiNhanSuWorkflowService _workflow;
        private readonly ICurrentNguoiDungService _current;
        private string _currentNote;
        private CancellationToken _currentCt;

        public LoiMoiNhanSuStateMachine(
            ILoiMoiNhanSuWorkflowService workflow,
            ICurrentNguoiDungService current,
            LoiMoiNhanSu entity
        )
        {
            _workflow = workflow;
            _current = current;
            _entity = entity;

            _machine = new StateMachine<TrangThaiLoiMoi, TriggerLoiMoi>(
                () => _entity.LoiMoi,
                s => _entity.LoiMoi = s
            );

            ConfigureTransitions();
        }

        public bool CanFire(TriggerLoiMoi trigger)
        {
            return _machine.CanFire(trigger);
        }

        public async Task<bool> CanFireAsync(TriggerLoiMoi trigger)
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
        /// Fire trigger có kiểm tra quyền (dành cho Người đại diện thu hồi lời mời).
        /// Caller tự <c>SaveChangesAsync</c> sau khi fire thành công (kể cả trong catch,
        /// vì lazy expiry có thể đã persist HetHan trước khi throw).
        /// </summary>
        public async Task FireAsync(TriggerLoiMoi trigger, string note = "", CancellationToken ct = default)
        {
            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi lời mời đang ở trạng thái '{_entity.LoiMoi}'.");
            }

            await ValidateAuthorization(trigger);

            // Lời mời quá hạn: persist HetHan trước rồi báo lỗi, caller SaveChanges cả trong catch.
            if (await DanhDauHetHanNeuQuaHanAsync(ct))
                throw new ApiException("Lời mời đã hết hạn.");

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Fire trigger bằng token link (ChapNhan/TuChoi), không kiểm tra đăng nhập.
        /// Token chính là credential; khớp email do caller kiểm tra (AcceptInvite, RejectInvite).
        /// Nếu lời mời đã quá hạn: tự persist HetHan (kèm side-effect) rồi throw.
        /// Caller phải <c>SaveChangesAsync</c> cả trong catch để lưu HetHan.
        /// </summary>
        public async Task FireByTokenAsync(TriggerLoiMoi trigger, string note = "", CancellationToken ct = default)
        {
            if (!LaTriggerToken(trigger))
                throw new ApiException($"Trigger '{trigger}' không dùng đường token.");

            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Lời mời đã được xử lý (trạng thái '{_entity.LoiMoi}').");
            }

            if (await DanhDauHetHanNeuQuaHanAsync(ct))
                throw new ApiException("Lời mời đã hết hạn.");

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Fire trigger hệ thống, bỏ kiểm tra quyền (job quét hết hạn).
        /// </summary>
        public async Task FireSystemAsync(TriggerLoiMoi trigger, string note = "", CancellationToken ct = default)
        {
            if (!LaTriggerHeThong(trigger))
                throw new ApiException($"Trigger '{trigger}' phải fire qua FireAsync hoặc FireByTokenAsync.");

            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi lời mời đang ở trạng thái '{_entity.LoiMoi}'.");
            }

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Các trigger đi bằng token link, không yêu cầu đăng nhập.
        /// </summary>
        public static bool LaTriggerToken(TriggerLoiMoi trigger)
            => trigger == TriggerLoiMoi.ChapNhan
            || trigger == TriggerLoiMoi.TuChoi;

        public static bool LaTriggerHeThong(TriggerLoiMoi trigger)
            => trigger == TriggerLoiMoi.DanhDauHetHan;

        /// <summary>
        /// Hết hạn lười: lời mời còn ChoXacNhan mà quá NgayHetHan thì chuyển HetHan ngay
        /// (kèm side-effect thông báo chủ invite). Trả true khi đã đánh dấu hết hạn.
        /// </summary>
        private async Task<bool> DanhDauHetHanNeuQuaHanAsync(CancellationToken ct)
        {
            if (_entity.LoiMoi != TrangThaiLoiMoi.ChoXacNhan
                || _entity.NgayHetHan >= DateTime.UtcNow
                || !_machine.CanFire(TriggerLoiMoi.DanhDauHetHan))
                return false;

            _currentNote = GetDefaultNote(TriggerLoiMoi.DanhDauHetHan);
            _currentCt = ct;

            await _machine.FireAsync(TriggerLoiMoi.DanhDauHetHan);

            _currentNote = null;
            return true;
        }

        /// <summary>
        /// Guard kiểm tra quyền: chỉ Người đại diện chủ invite được thu hồi.
        /// </summary>
        private async Task ValidateAuthorization(TriggerLoiMoi trigger)
        {
            if (LaTriggerToken(trigger))
                throw new ApiException("Hành động này thực hiện qua link token lời mời.");
            if (LaTriggerHeThong(trigger))
                throw new ApiException("Hành động này chỉ hệ thống được thực hiện.");

            var ctx = await _current.ResolveAsync();

            if (trigger == TriggerLoiMoi.HuyLoiMoi)
            {
                if (ctx.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN || _entity.NguoiDaiDienId != ctx.Id)
                    throw new ApiException("Chỉ Người đại diện đã gửi lời mời mới được thu hồi.", 403);
                return;
            }

            throw new ArgumentOutOfRangeException(nameof(trigger));
        }

        /// <summary>
        /// Hook chạy sau mỗi transition — ghi thông báo / email cho chủ invite và người được mời.
        /// </summary>
        private async Task OnTransitedAsync(StateMachine<TrangThaiLoiMoi, TriggerLoiMoi>.Transition transition)
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
            _machine.Configure(TrangThaiLoiMoi.ChoXacNhan)
                .Permit(TriggerLoiMoi.ChapNhan, TrangThaiLoiMoi.DaChapNhan)
                .Permit(TriggerLoiMoi.TuChoi, TrangThaiLoiMoi.DaTuChoi)
                .Permit(TriggerLoiMoi.HuyLoiMoi, TrangThaiLoiMoi.DaHuy)
                .Permit(TriggerLoiMoi.DanhDauHetHan, TrangThaiLoiMoi.HetHan);

            // Terminal
            _machine.Configure(TrangThaiLoiMoi.DaChapNhan).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiLoiMoi.DaTuChoi).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiLoiMoi.DaHuy).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiLoiMoi.HetHan).OnEntryAsync(OnTransitedAsync);
        }

        private static string GetDefaultNote(TriggerLoiMoi trigger) => trigger.ToString();
    }
}