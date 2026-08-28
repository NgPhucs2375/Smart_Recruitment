namespace Application.Features.NguoiDung.Queries.GetAllNguoiDungs
{
    public class GetAllNguoiDungsParameter
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }
}
