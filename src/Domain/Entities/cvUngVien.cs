using Domain.Common;
using Domain.Enums;
using Pgvector;
using System;
using System.Collections.Generic;
using System.Text;


namespace Domain.Entities
{
    /// <summary>
    /// Lưu tệp CV và thông tin quản lý CV của ứng viên.
    /// </summary>
    public class CVUngVien : AuditableBaseEntity
    {
        public int HoSoUngVienId { get; set; }
        public string TenFile { get; set; }
        public string FileUrl { get; set; }
        public DateTime? NgayUpload { get; set; }
        public bool IsDefault { get; set; } = true;
        public bool IsDaXoa { get; set; } = false;
        public string NoiDungJson { get; set; }
        public string TemplateId { get; set; }
        public PhuongThucTaoCV PhuongThucTao { get; set; }
        public Vector? Embedding { get; set; }
        public string? SemanticText { get; set; }
        public EmbeddingStatus EmbeddingStatus { get; set; }
        public DateTime? EmbeddingUpdatedAt { get; set; }
        public string EmbeddingError { get; set; }
        public string SemanticHash { get; set; }
        

        // ===   === //
        public HoSoUngVien HoSoUngVien { get; set; }
        public ICollection<KetQuaPhanTichCv> KetQuaPhanTichCvs { get; set; }

    }
}
