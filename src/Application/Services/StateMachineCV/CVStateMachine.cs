using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Stateless;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Services.StateMachineCV
{
    /// <summary>
    /// State machine cho CV ứng viên (mô hình 3 cấp):
    /// - Cấp 1 <see cref="PhuongThucTaoCV"/>: nhánh tạo CV, bất biến sau khi tạo.
    /// - Cấp 2 <see cref="TrangThaiTienTrinhCV"/>: sub-state để hiển thị/resume tiến trình,
    ///   cập nhật thủ công trong <see cref="FireAsync"/> và guard theo nhánh.
    /// - Cấp 3 <see cref="TrangThaiCV"/>: core state, điều khiển duy nhất bởi Stateless machine này.
    /// Tác nhân fire trigger: ứng viên chủ sở hữu CV (Admin được giám sát mọi trigger).
    /// </summary>
    public class CVStateMachine
    {
        private readonly StateMachine<TrangThaiCV, TriggerCVUngVien> _machine;
        private readonly CVUngVien _entity;
        private readonly ICVWorkflowService _workflow;
        private readonly ICurrentNguoiDungService _current;

        private string _currentNote;
        private CancellationToken _currentCt;

        /// <summary>
        /// Các TienTrinh hợp lệ theo từng nhánh tạo (cấp 1 -&gt; cấp 2).
        /// KhoiTaoMoi là bước trung tính, cho phép ở mọi nhánh.
        /// </summary>
        private static readonly Dictionary<PhuongThucTaoCV, HashSet<TrangThaiTienTrinhCV>> TienTrinhHopLeTheoNhanh = new()
        {
            [PhuongThucTaoCV.ThuCongTemplate] = new HashSet<TrangThaiTienTrinhCV>
            {
                TrangThaiTienTrinhCV.KhoiTaoMoi,
                TrangThaiTienTrinhCV.DangChinhSua,
                TrangThaiTienTrinhCV.HoanTatTienTrinh
            },
            [PhuongThucTaoCV.TaiLenTrucTiep] = new HashSet<TrangThaiTienTrinhCV>
            {
                TrangThaiTienTrinhCV.KhoiTaoMoi,
                TrangThaiTienTrinhCV.DangTaiLenStorage,
                TrangThaiTienTrinhCV.KiemTraDinhDangVaVirus,
                TrangThaiTienTrinhCV.LoiTaiLen,
                TrangThaiTienTrinhCV.HoanTatTienTrinh
            },
            [PhuongThucTaoCV.AIAgentHoTro] = new HashSet<TrangThaiTienTrinhCV>
            {
                TrangThaiTienTrinhCV.KhoiTaoMoi,
                TrangThaiTienTrinhCV.DangThuThapThongTin,
                TrangThaiTienTrinhCV.DangGoiModelTongHop,
                TrangThaiTienTrinhCV.ChoUngVienKiemTraLai,
                TrangThaiTienTrinhCV.LoiSinhDuLieuAI,
                TrangThaiTienTrinhCV.HoanTatTienTrinh
            }
        };

        public CVStateMachine(
            ICVWorkflowService workflow,
            ICurrentNguoiDungService current,
            CVUngVien entity)
        {
            _entity = entity;
            _workflow = workflow;
            _current = current;

            _machine = new StateMachine<TrangThaiCV, TriggerCVUngVien>(
                () => _entity.TrangThaiCV,
                s => _entity.TrangThaiCV = s);

            ConfigureTransitions();
        }

        // hàm kiểm tra xem trigger có thể được fire hay không, không kiểm tra quyền
        public bool CanFire(TriggerCVUngVien trigger) => _machine.CanFire(trigger);

        public async Task<bool> CanFireAsync(TriggerCVUngVien trigger)
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
        /// Fire trigger: kiểm tra transition (cấp 3) + quyền, cập nhật TienTrinh (cấp 2)
        /// và LoiChiTiet, rồi kích hoạt side-effect qua workflow.
        /// Caller tự <c>SaveChangesAsync</c> sau khi fire thành công.
        /// </summary>
        public async Task FireAsync(
            TriggerCVUngVien trigger,
            string note = "",
            TrangThaiTienTrinhCV? tienTrinhMoi = null,
            CancellationToken ct = default)
        {
            if (!_machine.CanFire(trigger))
            {
                throw new ApiException($"Không thể thực hiện hành động '{trigger}' khi CV đang ở trạng thái '{_entity.TrangThaiCV}'.");
            }

            await ValidateAuthorization(trigger);

            var tienTrinh = ResolveTienTrinh(trigger, tienTrinhMoi);
            if (tienTrinh.HasValue && !TienTrinhHopLeTheoNhanh[_entity.PhuongThucTaoCV].Contains(tienTrinh.Value))
            {
                throw new ApiException($"Tiến trình '{tienTrinh}' không thuộc nhánh '{_entity.PhuongThucTaoCV}'.");
            }

            // Cập nhật cấp 2 trước để side-effect ở OnEntry thấy đủ 3 cấp mới.
            if (tienTrinh.HasValue)
                _entity.TrangThaiTienTrinhCV = tienTrinh.Value;

            // Ghi/xóa chi tiết lỗi kỹ thuật.
            if (trigger == TriggerCVUngVien.TaiLenThatBai || trigger == TriggerCVUngVien.ModelGenThatBai)
                _entity.LoiChiTiet = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            else if (trigger == TriggerCVUngVien.ThuLaiSauLoi
                || trigger == TriggerCVUngVien.HoanTatThuCong
                || trigger == TriggerCVUngVien.KiemTraHopLe
                || trigger == TriggerCVUngVien.UngVienDuyetAI)
                _entity.LoiChiTiet = string.Empty;

            _currentNote = string.IsNullOrWhiteSpace(note) ? GetDefaultNote(trigger) : note;
            _currentCt = ct;

            await _machine.FireAsync(trigger);

            _currentNote = null;
        }

        /// <summary>
        /// Guard kiểm tra quyền: CV là tài sản riêng của ứng viên.
        /// HR/NTD tương tác với CV thông qua DonUngTuyen, không fire trực tiếp machine này.
        /// </summary>
        private async Task ValidateAuthorization(TriggerCVUngVien trigger)
        {
            var ctx = await _current.ResolveAsync();

            // Admin giám sát được mọi trigger.
            if (ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN)
                return;

            if (ctx.VaiTro != VaiTroNguoiDung.UNG_VIEN)
                throw new ApiException("Chỉ ứng viên chủ sở hữu CV được thực hiện hành động này.");

            // Entity load kèm HoSoUngVien thì đối chiếu NguoiDungId; nếu chưa Include navigation
            // thì quyền sở hữu đã được kiểm tra ở command handler theo HoSoUngVienId nên cho qua.
            if (_entity.HoSoUngVien != null && _entity.HoSoUngVien.NguoiDungId != ctx.Id)
                throw new ApiException("Bạn không phải chủ sở hữu CV này.", 403);
        }

        /// <summary>
        /// Hook chạy sau mỗi transition — ghi thông báo / cập nhật entity liên quan.
        /// </summary>
        private async Task OnTransitedAsync(StateMachine<TrangThaiCV, TriggerCVUngVien>.Transition transition)
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
            // DangXuLy: trung tâm điều phối 3 nhánh. Các trigger nội nhánh dùng PermitReentry
            // (ở yên DangXuLy, chỉ tiến TienTrinh cấp 2) để OnEntry vẫn bắn side-effect.
            _machine.Configure(TrangThaiCV.DangXuLy)
                .OnEntryAsync(OnTransitedAsync)
                .PermitReentry(TriggerCVUngVien.BatDauTao)
                .PermitReentry(TriggerCVUngVien.LuuNhapThuCong)
                .PermitReentry(TriggerCVUngVien.TaiLenThanhCong)
                .PermitReentry(TriggerCVUngVien.ModelGenThanhCong)
                .PermitReentry(TriggerCVUngVien.YeuCauGenLaiAI)
                .Permit(TriggerCVUngVien.HoanTatThuCong, TrangThaiCV.SanSang)
                .Permit(TriggerCVUngVien.KiemTraHopLe, TrangThaiCV.SanSang)
                .Permit(TriggerCVUngVien.UngVienDuyetAI, TrangThaiCV.SanSang)
                .Permit(TriggerCVUngVien.TaiLenThatBai, TrangThaiCV.Loi)
                .Permit(TriggerCVUngVien.ModelGenThatBai, TrangThaiCV.Loi)
                .Permit(TriggerCVUngVien.VoHieuHoa, TrangThaiCV.VoHieuHoa);

            _machine.Configure(TrangThaiCV.Loi)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerCVUngVien.ThuLaiSauLoi, TrangThaiCV.DangXuLy)
                .Permit(TriggerCVUngVien.VoHieuHoa, TrangThaiCV.VoHieuHoa);

            _machine.Configure(TrangThaiCV.SanSang)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerCVUngVien.ChinhSuaLai, TrangThaiCV.DangXuLy)
                .Permit(TriggerCVUngVien.VoHieuHoa, TrangThaiCV.VoHieuHoa);

            _machine.Configure(TrangThaiCV.VoHieuHoa)
                .OnEntryAsync(OnTransitedAsync)
                .Permit(TriggerCVUngVien.KhoiPhuc, TrangThaiCV.SanSang);
        }

        /// <summary>
        /// TienTrinh mặc định theo trigger khi caller không truyền tường minh.
        /// VoHieuHoa/KhoiPhuc trả null = giữ nguyên TienTrinh hiện tại.
        /// </summary>
        private TrangThaiTienTrinhCV? ResolveTienTrinh(TriggerCVUngVien trigger, TrangThaiTienTrinhCV? explicitTienTrinh)
        {
            if (explicitTienTrinh.HasValue)
                return explicitTienTrinh.Value;

            return trigger switch
            {
                TriggerCVUngVien.BatDauTao => _entity.PhuongThucTaoCV switch
                {
                    PhuongThucTaoCV.TaiLenTrucTiep => TrangThaiTienTrinhCV.DangTaiLenStorage,
                    PhuongThucTaoCV.AIAgentHoTro => TrangThaiTienTrinhCV.DangThuThapThongTin,
                    _ => TrangThaiTienTrinhCV.KhoiTaoMoi,
                },
                TriggerCVUngVien.LuuNhapThuCong => TrangThaiTienTrinhCV.DangChinhSua,
                TriggerCVUngVien.HoanTatThuCong => TrangThaiTienTrinhCV.HoanTatTienTrinh,
                TriggerCVUngVien.TaiLenThanhCong => TrangThaiTienTrinhCV.KiemTraDinhDangVaVirus,
                TriggerCVUngVien.KiemTraHopLe => TrangThaiTienTrinhCV.HoanTatTienTrinh,
                TriggerCVUngVien.TaiLenThatBai => TrangThaiTienTrinhCV.LoiTaiLen,
                TriggerCVUngVien.ModelGenThanhCong => TrangThaiTienTrinhCV.ChoUngVienKiemTraLai,
                TriggerCVUngVien.ModelGenThatBai => TrangThaiTienTrinhCV.LoiSinhDuLieuAI,
                TriggerCVUngVien.UngVienDuyetAI => TrangThaiTienTrinhCV.HoanTatTienTrinh,
                TriggerCVUngVien.YeuCauGenLaiAI => TrangThaiTienTrinhCV.DangGoiModelTongHop,
                TriggerCVUngVien.ThuLaiSauLoi => _entity.PhuongThucTaoCV switch
                {
                    PhuongThucTaoCV.TaiLenTrucTiep => TrangThaiTienTrinhCV.DangTaiLenStorage,
                    PhuongThucTaoCV.AIAgentHoTro => TrangThaiTienTrinhCV.DangThuThapThongTin,
                    _ => TrangThaiTienTrinhCV.DangChinhSua,
                },
                TriggerCVUngVien.ChinhSuaLai => TrangThaiTienTrinhCV.DangChinhSua,
                _ => null,
            };
        }

        private static string GetDefaultNote(TriggerCVUngVien trigger) => trigger.ToString();
    }
}
