namespace Application.DTOs.CV
{
    public class DuAnDTO
    {
        public string TenDuAn { get; set; }
        public string VaiTro { get; set; }
        public List<string> CongNghe { get; set; } = new();
        public string Link { get; set; }
        public string MoTa { get; set; }
    }
}
