namespace Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens
{
    public class GetAllDonUngTuyensParameter
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }

        public int? HoSoUngVienId { get; set; }
        
        public int? TinTuyenDungId { get; set; }
    }
}

