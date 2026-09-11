using System.Collections.Generic;
using Domain.Enums;

namespace Application.DTOs.CV
{
    public class CapNhatCVUngVienDto
    {
        public int Id { get; set; }

        public string TenFile { get; set; }

        public string TemplateId { get; set; }

        public bool IsDefault { get; set; }

        public PhuongThucTaoCV PhuongThucTao { get; set; }

        public NoiDungCVDto NoiDung { get; set; }
    }
}