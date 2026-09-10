namespace Application.DTOs.CV
{
    public class CapNhatCVUngVienDto
    {
        public int Id { get; set; }

        public string TenFile { get; set; }

        public string TemplateId { get; set; }

        public bool IsDefault { get; set; }

        public TaoCVThuCong NoiDung { get; set; }
    }
}