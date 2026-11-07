using Domain.Enums;
using System;

namespace Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;

public class GetAllKetQuaPhanTichCvsViewModel
{
    public int Id { get; set; }
    public int CVUngVienId { get; set; }
    public string NoiDungTrichXuat { get; set; }
    public string KyNangTrichXuat { get; set; }
    public string KinhNghiemTrichXuat { get; set; }
    public string HocVanTrichXuat { get; set; }
    public TrangThaiPhanTichAgent PhanTich { get; set; }

    // Kết quả đánh giá theo tin tuyển dụng (AI agent), null khi chưa chạy.
    public int? DiemTongQuan { get; set; }
    public float? DiemPhuHop { get; set; }
    public string? MatchingVersion { get; set; }
    public int? TinTuyenDungId { get; set; }
    public string? NhanXet { get; set; }
    public string? DiemManh { get; set; }
    public string? DiemYeu { get; set; }
    public string? GoiY { get; set; }
    public DateTime? DanhGiaLuc { get; set; }
    public bool DaDanhGiaBangAi { get; set; }
}