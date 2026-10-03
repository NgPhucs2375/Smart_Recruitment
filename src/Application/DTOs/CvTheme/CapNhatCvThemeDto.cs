namespace Application.DTOs.CvTheme
{
    public class CapNhatCvThemeDto
    {
        public int Id { get; set; }
        public string Slug { get; set; }
        public string Ten { get; set; }
        public string MoTa { get; set; }
        public string MoTaNgan { get; set; }
        public string DanhMuc { get; set; }
        public string NganhPhuHop { get; set; }
        public string ViTriMucTieu { get; set; }
        public string CapBac { get; set; }
        public string Tags { get; set; }
        public string PhongCachThietKe { get; set; }
        public int SoCot { get; set; } = 1;
        public bool ThanThienATS { get; set; } = true;
        public string MauSacChuDao { get; set; }
        public string TamLyMauSac { get; set; }
        public string KhuyenNghiSuDung { get; set; }
        public string TranhSuDungKhi { get; set; }
        public string GoiYAI { get; set; }
        public bool LaMacDinh { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int ThuTu { get; set; } = 0;
    }
}
