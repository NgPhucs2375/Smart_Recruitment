using System;

namespace Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;

public class GetAllKetQuaPhanTichCvsViewModel
{
    public int Id { get; set; }
    public int CVUngVienId { get; set; }
    public string NoiDungTrichXuat { get; set; }
    public string KyNangTrichXuat { get; set; }
    public string KinhNghiemTrichXuat { get; set; }
    public DateTime? NgayPhanTich { get; set; }
}