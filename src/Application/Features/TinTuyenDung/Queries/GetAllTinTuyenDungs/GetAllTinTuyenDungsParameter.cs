namespace Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs
{
    public class GetAllTinTuyenDungsParameter
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
        public string Location { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string Level { get; set; }
        public string EmploymentType { get; set; }
        public string WorkMode { get; set; }
    }
}
