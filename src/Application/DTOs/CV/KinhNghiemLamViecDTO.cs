namespace Application.DTOs.CV
{
    public class KinhNghiemLamViecDTO
    {
        public string CongTy { get; set; }
        public string ChucDanh { get; set; }
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public bool IsHienTai { get; set; }
        public string MoTa { get; set; }
        public List<string> KyNangSuDung { get; set; } = new();
    }
}
