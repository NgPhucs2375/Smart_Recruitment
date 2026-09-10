namespace Application.DTOs.CV
{
    public class TaoCVUngVienDto
    {
        public int HoSoUngVienId { get; set; }

        public string TenFile { get; set; }

        public string TemplateId { get; set; }

        public bool IsDefault { get; set; } = true;

        public TaoCVThuCong NoiDung { get; set; }
    }
}