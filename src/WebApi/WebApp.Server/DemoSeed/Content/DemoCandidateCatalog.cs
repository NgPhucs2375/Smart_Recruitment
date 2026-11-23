namespace WebApp.Server.DemoSeed.Content;

/// <summary>
/// Bốn mươi tám ứng viên biên tập (không trùng tài khoản @seed.local đang có).
/// Email demo.ungvienNN@demo.local là khoá tự nhiên để chạy lại không nhân bản
/// và để --clean chỉ xoá đúng dữ liệu demo.
/// </summary>
internal static class DemoCandidateCatalog
{
    public static readonly DemoCandidateDef[] All =
    [
        new("Nguyễn Minh Anh", "Nữ", 1997, "Cầu Giấy, Hà Nội", "dotnet", "Mid", 3f, 25_000_000),
        new("Trần Quốc Bảo", "Nam", 1994, "Thanh Xuân, Hà Nội", "dotnet", "Senior", 6f, 38_000_000),
        new("Lê Thị Ngọc Hân", "Nữ", 1999, "Hai Bà Trưng, Hà Nội", "dotnet", "Junior", 1.5f, 15_000_000),
        new("Phạm Đức Duy", "Nam", 1996, "Bình Thạnh, TP. Hồ Chí Minh", "fullstack", "Mid", 4f, 28_000_000),
        new("Hoàng Thanh Tùng", "Nam", 1993, "Quận 7, TP. Hồ Chí Minh", "fullstack", "Senior", 7f, 36_000_000),
        new("Vũ Thị Mai Chi", "Nữ", 1998, "Đống Đa, Hà Nội", "frontend", "Mid", 3f, 22_000_000),
        new("Đặng Hoài Nam", "Nam", 1995, "Thủ Đức, TP. Hồ Chí Minh", "frontend", "Mid", 4f, 24_000_000),
        new("Bùi Khánh Linh", "Nữ", 2000, "Tây Hồ, Hà Nội", "frontend", "Junior", 1f, 14_000_000),
        new("Ngô Gia Huy", "Nam", 1996, "Quận 1, TP. Hồ Chí Minh", "data", "Mid", 3.5f, 24_000_000),
        new("Đỗ Thu Trang", "Nữ", 1992, "Hoàn Kiếm, Hà Nội", "data", "Senior", 8f, 35_000_000),
        new("Trịnh Văn Kiên", "Nam", 1999, "Hải Châu, Đà Nẵng", "data", "Junior", 1.5f, 14_000_000),
        new("Lý Thị Kim Ngân", "Nữ", 1995, "Tân Bình, TP. Hồ Chí Minh", "devops", "Mid", 4f, 30_000_000),
        new("Phan Anh Tuấn", "Nam", 1991, "Nam Từ Liêm, Hà Nội", "devops", "Senior", 9f, 40_000_000),
        new("Nguyễn Hữu Phước", "Nam", 1997, "Gò Vấp, TP. Hồ Chí Minh", "qa", "Mid", 3f, 19_000_000),
        new("Trần Lê Thảo Vy", "Nữ", 1998, "Long Biên, Hà Nội", "qa", "Junior", 2f, 15_000_000),
        new("Phạm Nhật Minh", "Nam", 1994, "Cầu Giấy, Hà Nội", "qa", "Senior", 6f, 25_000_000),
        new("Hoàng Mỹ Duyên", "Nữ", 1996, "Ba Đình, Hà Nội", "design", "Mid", 4f, 22_000_000),
        new("Vũ Quốc Cường", "Nam", 1993, "Quận 3, TP. Hồ Chí Minh", "design", "Senior", 7f, 32_000_000),
        new("Đặng Thuỳ Dương", "Nữ", 1999, "Tây Hồ, Hà Nội", "design", "Junior", 1.5f, 13_000_000),
        new("Bùi Thanh Hà", "Nữ", 1995, "Thanh Xuân, Hà Nội", "hr", "Mid", 4f, 16_000_000),
        new("Nguyễn Thị Bích Ngọc", "Nữ", 1991, "Quận 1, TP. Hồ Chí Minh", "hr", "Senior", 9f, 25_000_000),
        new("Lê Minh Châu", "Nữ", 1998, "Thủ Đức, TP. Hồ Chí Minh", "hr", "Junior", 2f, 12_000_000),
        new("Trần Văn Lộc", "Nam", 1994, "Tân Phú, TP. Hồ Chí Minh", "sales", "Mid", 5f, 17_000_000),
        new("Phạm Thị Ánh Tuyết", "Nữ", 1996, "Bình Thạnh, TP. Hồ Chí Minh", "sales", "Mid", 3.5f, 16_000_000),
        new("Hoàng Đức Thịnh", "Nam", 1992, "Thanh Khê, Đà Nẵng", "sales", "Senior", 8f, 22_000_000),
        new("Vũ Thị Hồng Nhung", "Nữ", 1995, "Hà Đông, Hà Nội", "accounting", "Mid", 4f, 15_000_000),
        new("Đỗ Văn Thành", "Nam", 1990, "Đống Đa, Hà Nội", "accounting", "Senior", 11f, 24_000_000),
        new("Nguyễn Phương Thảo", "Nữ", 1999, "Bình Tân, TP. Hồ Chí Minh", "accounting", "Junior", 2f, 12_000_000),
        new("Bùi Tuấn Kiệt", "Nam", 1996, "Phú Nhuận, TP. Hồ Chí Minh", "marketing", "Mid", 4f, 17_000_000),
        new("Lê Ngọc Ánh", "Nữ", 1997, "Hoàng Mai, Hà Nội", "marketing", "Mid", 3f, 16_000_000),
        new("Trịnh Công Sơn", "Nam", 1994, "Sơn Trà, Đà Nẵng", "logistics", "Mid", 5f, 17_000_000),
        new("Phan Thị Thu Hà", "Nữ", 1996, "Tân Bình, TP. Hồ Chí Minh", "logistics", "Mid", 3f, 15_000_000),
        new("Nguyễn Trọng Hiếu", "Nam", 1999, "Bình Chánh, TP. Hồ Chí Minh", "logistics", "Junior", 1.5f, 11_000_000),
        new("Trần Minh Quân", "Nam", 1993, "Đông Anh, Hà Nội", "mechanical", "Mid", 6f, 18_000_000),
        new("Lê Văn Dũng", "Nam", 1990, "Mê Linh, Hà Nội", "mechanical", "Senior", 12f, 25_000_000),
        new("Phạm Thị Lan Anh", "Nữ", 1997, "Đà Lạt, Lâm Đồng", "food", "Mid", 4f, 15_000_000),
        new("Hoàng Văn Sơn", "Nam", 1994, "Bảo Lộc, Lâm Đồng", "food", "Mid", 5f, 16_000_000),
        new("Vũ Thị Thanh Huyền", "Nữ", 1995, "Thanh Xuân, Hà Nội", "education", "Mid", 4f, 16_000_000),
        new("Đặng Minh Trí", "Nam", 1991, "Cầu Giấy, Hà Nội", "education", "Senior", 9f, 23_000_000),
        new("Nguyễn Thảo Nguyên", "Nữ", 1999, "Hai Bà Trưng, Hà Nội", "education", "Junior", 1.5f, 12_000_000),
        new("Bùi Gia Bảo", "Nam", 1996, "Nha Trang, Khánh Hoà", "hospitality", "Mid", 3f, 14_000_000),
        new("Ngô Thị Kim Oanh", "Nữ", 1994, "Nha Trang, Khánh Hoà", "hospitality", "Senior", 7f, 19_000_000),
        new("Lý Hoàng Yến", "Nữ", 1998, "Cam Ranh, Khánh Hoà", "hospitality", "Junior", 2f, 11_000_000),
        new("Trần Đình Khoa", "Nam", 1995, "Quận 10, TP. Hồ Chí Minh", "customer-service", "Mid", 3f, 13_000_000),
        new("Phạm Thu Hằng", "Nữ", 1997, "Thanh Trì, Hà Nội", "customer-service", "Junior", 2f, 11_000_000),
        new("Lê Quốc Trung", "Nam", 1993, "Hoàn Kiếm, Hà Nội", "finance", "Mid", 5f, 20_000_000),
        new("Nguyễn Thị Mai Phương", "Nữ", 1995, "Quận 4, TP. Hồ Chí Minh", "finance", "Mid", 4f, 19_000_000),
        new("Đỗ Hoàng Long", "Nam", 1991, "Ba Đình, Hà Nội", "finance", "Senior", 10f, 30_000_000)
    ];

    public static string EmailOf(int index) => $"demo.ungvien{index + 1:00}@demo.local";
    public static string UserNameOf(int index) => $"demo.ungvien{index + 1:00}";
}
