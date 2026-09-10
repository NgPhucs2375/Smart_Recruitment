namespace Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs
{
    public class GetAllHoSoNhaTuyenDungsParameter
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }
}
