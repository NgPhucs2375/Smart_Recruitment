namespace Application.Features.KyNang.Queries.GetAllKyNangs
{
    public class GetAllKyNangsParameter
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }
}
