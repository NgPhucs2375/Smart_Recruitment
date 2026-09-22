using Domain.Enums;
using System;

namespace Domain.Entities;

public class CVImportSession
{
    public Guid Id { get; set; }
    public int HoSoUngVienId { get; set; }
    public int NguoiDungId { get; set; }
    public string OriginalObjectKey { get; set; }
    public string OriginalFileName { get; set; }
    public string OriginalContentType { get; set; }
    public long OriginalFileSize { get; set; }
    public TrangThaiCvImport TrangThai { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public int? CVUngVienId { get; set; }

    public HoSoUngVien HoSoUngVien { get; set; }
    public CVUngVien? CVUngVien { get; set; }
}
