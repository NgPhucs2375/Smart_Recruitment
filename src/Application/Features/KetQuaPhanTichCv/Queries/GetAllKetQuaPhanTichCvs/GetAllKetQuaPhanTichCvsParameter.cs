namespace Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;

public class GetAllKetQuaPhanTichCvsParameter
{
    public int _start { get; set; }
    public int _end { get; set; }
    public string _order { get; set; }
    public string _sort { get; set; }
    public string _filter { get; set; }
    public int? CVUngVienId { get; set; }
}