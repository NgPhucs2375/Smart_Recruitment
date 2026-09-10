using Domain.Enums;

namespace Application.DTOs.CV
{
    public class KyNangDTO
    {
    public int? KyNangId { get; set; }

    public string TenKyNang { get; set; }

    public MucDo MucDoThanhThao { get; set; }

    public float? SoNamKinhNghiem { get; set; }    }
}
