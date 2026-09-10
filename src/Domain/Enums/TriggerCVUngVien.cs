namespace Domain.Enums
{
    public enum TriggerCVUngVien
        {
// Ứng viên khởi phát
        BatDauTao,            // tạo record DangXuLy + KhoiTaoMoi/DangTaiLen/DangThuThap
        LuuNhapThuCong,       // ThuCong: DangChinhSua -> vẫn DangXuLy
        HoanTatThuCong,       // ThuCong: -> SanSang + HoanTatTienTrinh
        ChinhSuaLai,          // SanSang -> DangXuLy (mở lại để sửa)
        UngVienDuyetAI,       // AI: ChoKiemTraLai -> SanSang
        YeuCauGenLaiAI,       // AI: ChoKiemTraLai -> DangGoiModel (retry)
        // Hệ thống / kỹ thuật
        TaiLenThanhCong,      // Upload: DangTaiLen -> KiemTraDinhDang
        KiemTraHopLe,         // Upload: -> SanSang
        TaiLenThatBai,        // Upload/AI: -> Loi
        ModelGenThanhCong,    // AI: DangGoiModel -> ChoKiemTraLai
        ModelGenThatBai,      // AI: -> Loi
        ThuLaiSauLoi,         // Loi -> DangXuLy (retry đúng bước nhánh)
        // Vòng đời
        VoHieuHoa,            // SanSang/Loi -> VoHieuHoa (xóa mềm)
        KhoiPhuc,             // VoHieuHoa -> SanSang (hoặc DangXuLy)
        }
}