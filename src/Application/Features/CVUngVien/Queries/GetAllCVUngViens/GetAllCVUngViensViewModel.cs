using System;
namespace Application.Features.CVUngVien.Queries.GetAllCVUngViens;
public class GetAllCVUngViensViewModel { public int Id { get; set; } public int HoSoUngVienId { get; set; } public string TenFile { get; set; } public string FileUrl { get; set; } public DateTime? NgayUpload { get; set; } public bool IsDefault { get; set; } }
