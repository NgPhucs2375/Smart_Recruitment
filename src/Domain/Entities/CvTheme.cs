using Domain.Common;
using Pgvector;

namespace Domain.Entities
{
    /// <summary>
    /// Theme/mẫu CV dùng chung: metadata hiển thị + gợi ý AI.
    /// Render vẫn do frontend TEMPLATE_REGISTRY quyết định qua Slug —
    /// bảng này không thay đổi luồng render hiện tại.
    /// </summary>
    public class CvTheme : AuditableBaseEntity
    {
        /// <summary>Định danh ổn định, trùng id trong TEMPLATE_REGISTRY (vd: tech-modern).</summary>
        public string Slug { get; set; }

        public string Ten { get; set; }

        public string MoTa { get; set; }

        public string MoTaNgan { get; set; }

        /// <summary>StorageKey Minio của ảnh preview (cv-themes/{slug}/...). Null = render live thumbnail.</summary>
        public string PreviewStorageKey { get; set; }

        /// <summary>Danh mục chính: ats/developer/corporate/creative/senior/fresher.</summary>
        public string DanhMuc { get; set; }

        /// <summary>Ngành phù hợp, CSV (vd: IT,Data,Marketing). "all" = mọi ngành.</summary>
        public string NganhPhuHop { get; set; }

        /// <summary>Vị trí mục tiêu, CSV (vd: Backend,BA,PM).</summary>
        public string ViTriMucTieu { get; set; }

        /// <summary>Cấp bậc: fresher/junior/senior/lead/all.</summary>
        public string CapBac { get; set; }

        /// <summary>Tags tìm kiếm, CSV (đồng bộ tags[] của registry).</summary>
        public string Tags { get; set; }

        /// <summary>Phong cách thiết kế: ats/classic/modern/creative/editorial.</summary>
        public string PhongCachThietKe { get; set; }

        public int SoCot { get; set; } = 1;

        public bool ThanThienATS { get; set; } = true;

        /// <summary>Màu chủ đạo, hex CSV.</summary>
        public string MauSacChuDao { get; set; }

        public string TamLyMauSac { get; set; }

        public string KhuyenNghiSuDung { get; set; }

        public string TranhSuDungKhi { get; set; }

        /// <summary>Gợi ý tự do cho AI agent khi trình bày đề xuất.</summary>
        public string GoiYAI { get; set; }

        public bool LaMacDinh { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public int ThuTu { get; set; } = 0;

        /// <summary>Model sinh embedding (phase 2). Null = chưa có vector.</summary>
        public string EmbeddingModel { get; set; }

        /// <summary>Vector ngữ nghĩa mô tả theme (phase 2, pgvector). Null = chưa backfill.</summary>
        public Pgvector.Vector Embedding { get; set; }
    }
}
