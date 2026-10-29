namespace Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;

public class BaoCaoTuyenDungVm
{
    public DateTime GeneratedAtUtc { get; set; }
    public int KyNgay { get; set; }
    /// <summary>"he-thong" với QUAN_TRI_VIEN, "doanh-nghiep" với NGUOI_DAI_DIEN / NHAN_SU.</summary>
    public string PhamVi { get; set; } = "";
    public int TinDaDang { get; set; }
    public int? TinKyTruoc { get; set; }
    public double? TyLeTin { get; set; }
    public int LuotNop { get; set; }
    public int? LuotNopKyTruoc { get; set; }
    public double? TyLeNop { get; set; }
    public int UngVienDuyNhat { get; set; }
    public List<KetQuaTheoTrangThaiVm> KetQua { get; set; } = new();
    public List<DiemXuHuongVm> XuHuong { get; set; } = new();
    public List<TinNhieuDonVm> TopTin { get; set; } = new();
    public DuyetTinVm DuyetTin { get; set; } = new();
}

public class KetQuaTheoTrangThaiVm
{
    public int TrangThaiId { get; set; }
    public string TrangThai { get; set; } = "";
    public int SoLuong { get; set; }
}

public class DiemXuHuongVm
{
    /// <summary>Ngày dạng yyyy-MM-dd.</summary>
    public string Ngay { get; set; } = "";
    public int SoLuong { get; set; }
}

public class TinNhieuDonVm
{
    public int Id { get; set; }
    public string TieuDe { get; set; } = "";
    public int TrangThaiId { get; set; }
    public string TrangThai { get; set; } = "";
    public int SoDon { get; set; }
}

public class DuyetTinVm
{
    public int DaDuyet { get; set; }
    public int ChoDuyet { get; set; }
    public int TuChoi { get; set; }
    public int Nhap { get; set; }
    /// <summary>DaDuyet / (DaDuyet + TuChoi) * 100. Null khi chưa có tin nào được quyết định.</summary>
    public double? TyLeDuyet { get; set; }
}
