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
    /// Trạng thái: TrangThaiDonUngTuyen. Sự kiện: TriggerDonUngTuyen.
    /// </summary>
    public class DonUngTuyenStateMachine
    {
        private readonly StateMachine<TrangThaiDonUngTuyen, TriggerDonUngTuyen> _machine;
        private readonly DonUngTuyen _entity;
        private readonly IDonUngTuyenWorkflowService _workflow;
        private readonly ICurrentNguoiDungService _current;

        private string _currentNote;
        private CancellationToken _currentCt;

        private readonly StateMachine<TrangThaiDonUngTuyen, TriggerDonUngTuyen>.TriggerWithParameters<string, CancellationToken>
            _xemDon,
            _danhGiaPhuHop,
            _taoLichPhongVan,
            _congBoTrungTuyen,
            _tuChoi,
            _rutDonTruocPhongVan,
            _rutDonSauPhongVan;

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

            // truyền tham số trigger 
            _xemDon = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.XemDon);
            _danhGiaPhuHop = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.DanhGiaPhuHop);
            _taoLichPhongVan = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.TaoLichPhongVan);
            _congBoTrungTuyen = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.CongBoTrungTuyen);
            _tuChoi = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.TuChoi);
            _rutDonTruocPhongVan = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.RutDonTruocPhongVan);
            _rutDonSauPhongVan = _machine.SetTriggerParameters<string, CancellationToken>(TriggerDonUngTuyen.RutDonSauPhongVan);

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

        // hàm phát tín hiệu 
        public async Task FireAsync(TriggerDonUngTuyen trigger, string note = "", CancellationToken ct = default)
        {
            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi đơn đang ở trạng thái '{_entity.TrangThai}'.");
            }

            await ValidateAuthorization(trigger);

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            var paramTrigger = trigger switch
            {
                TriggerDonUngTuyen.XemDon => _xemDon,
                TriggerDonUngTuyen.DanhGiaPhuHop => _danhGiaPhuHop,
                TriggerDonUngTuyen.TaoLichPhongVan => _taoLichPhongVan,
                TriggerDonUngTuyen.CongBoTrungTuyen => _congBoTrungTuyen,
                TriggerDonUngTuyen.TuChoi => _tuChoi,
                TriggerDonUngTuyen.RutDonTruocPhongVan => _rutDonTruocPhongVan,
                TriggerDonUngTuyen.RutDonSauPhongVan => _rutDonSauPhongVan,
                _ => throw new ArgumentOutOfRangeException(nameof(trigger))
            };

            await _machine.FireAsync(paramTrigger, _currentNote, _currentCt);

            _currentNote = null;
        }

        /// <summary>
        /// Guard kiểm tra quyền trước khi cho phép fire trigger.
        /// </summary>
        private async Task ValidateAuthorization(TriggerDonUngTuyen trigger)
        {
            var ctx = await _current.ResolveAsync();
            bool isHr = ctx.VaiTro == VaiTroNguoiDung.NHAN_SU || ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN;

            switch (trigger)
            {
                // Các hành động của Nhân sự / Người đại diện, chỉ áp dụng cho đơn thuộc tin họ đăng/tổ chức họ thuộc về
                case TriggerDonUngTuyen.XemDon:
                case TriggerDonUngTuyen.DanhGiaPhuHop:
                case TriggerDonUngTuyen.TaoLichPhongVan:
                case TriggerDonUngTuyen.CongBoTrungTuyen:
                case TriggerDonUngTuyen.TuChoi:
                    if (!isHr)
                        throw new ApiException("Chỉ Nhân sự hoặc Người đại diện được thực hiện hành động này.");
                    bool owned = _entity.TinTuyenDung != null &&
                        (_entity.TinTuyenDung.NguoiDangTinId == ctx.Id
                         || _entity.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
                    if (!owned)
                        throw new ApiException("Bạn không có quyền xử lý đơn ứng tuyển này.", 403);
                    break;

                // Chỉ ứng viên là người nộp đơn mới được rút
                case TriggerDonUngTuyen.RutDonTruocPhongVan:
                case TriggerDonUngTuyen.RutDonSauPhongVan:
                    if (ctx.VaiTro != VaiTroNguoiDung.UNG_VIEN)
                        throw new ApiException("Chỉ ứng viên mới được rút đơn.");
                    if (_entity.HoSoUngVien == null || _entity.HoSoUngVien.NguoiDungId != ctx.Id)
                        throw new ApiException("Bạn không phải người nộp đơn này.");
                    break;
            }
        }

        /// <summary>
        /// Hook chạy sau mỗi transition — ghi thông báo / email / cập nhật entity liên quan.
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
            _machine.Configure(TrangThaiDonUngTuyen.ChoXuLy)
                .Permit(TriggerDonUngTuyen.XemDon, TrangThaiDonUngTuyen.DaXem);

            _machine.Configure(TrangThaiDonUngTuyen.DaXem)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.DanhGiaPhuHop, TrangThaiDonUngTuyen.PhuHop)
                .Permit(TriggerDonUngTuyen.TuChoi, TrangThaiDonUngTuyen.TuChoi)
                .Permit(TriggerDonUngTuyen.RutDonTruocPhongVan, TrangThaiDonUngTuyen.UngVienRutDon);

            _machine.Configure(TrangThaiDonUngTuyen.PhuHop)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.TaoLichPhongVan, TrangThaiDonUngTuyen.HenPhongVan)
                .Permit(TriggerDonUngTuyen.TuChoi, TrangThaiDonUngTuyen.TuChoi)
                .Permit(TriggerDonUngTuyen.RutDonTruocPhongVan, TrangThaiDonUngTuyen.UngVienRutDon);

            _machine.Configure(TrangThaiDonUngTuyen.HenPhongVan)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerDonUngTuyen.CongBoTrungTuyen, TrangThaiDonUngTuyen.TrungTuyen)
                .Permit(TriggerDonUngTuyen.TuChoi, TrangThaiDonUngTuyen.TuChoi)
                .Permit(TriggerDonUngTuyen.RutDonSauPhongVan, TrangThaiDonUngTuyen.UngVienRutDon);

            _machine.Configure(TrangThaiDonUngTuyen.TrungTuyen).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiDonUngTuyen.TuChoi).OnEntryAsync(OnTransitedAsync);
            _machine.Configure(TrangThaiDonUngTuyen.UngVienRutDon).OnEntryAsync(OnTransitedAsync);
        }

        private static string GetDefaultNote(TriggerDonUngTuyen trigger) => trigger.ToString();
    }
}
