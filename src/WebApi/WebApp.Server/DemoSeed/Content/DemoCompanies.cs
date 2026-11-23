namespace WebApp.Server.DemoSeed.Content;

/// <summary>
/// Mười doanh nghiệp đã được DefaultBulkTestAccounts tạo theo MST. Bộ nạp demo chỉ
/// làm giàu phần mô tả còn là câu placeholder ("Doanh nghiệp demo gắn với...") và
/// dùng chúng làm chủ tin — không tạo thêm tài khoản doanh nghiệp nào.
/// </summary>
internal static class DemoCompanies
{
    public static readonly DemoCompanyContent[] All =
    [
        new("0109876501", "Công ty TNHH Phần mềm Sao Khuê",
            "Sao Khuê phát triển nền tảng ngân hàng số và ứng dụng quản trị cho các tổ chức tài chính, bảo hiểm tại Việt Nam. Đội ngũ hơn 80 kỹ sư vận hành mô hình product team, phát hành bản mới hai tuần một lần và duy trì SLA 99,9% cho khách hàng doanh nghiệp.",
            "Công nghệ thông tin", "50-100 nhân viên",
            "Tòa nhà Sao Khuê, Duy Tân, Cầu Giấy, Hà Nội", "https://saokhue.example.com",
            "nền tảng ngân hàng số và hệ thống quản trị doanh nghiệp",
            [
                "Lương tháng 13 cộng thưởng hiệu suất theo quý, xét tăng lương hai lần mỗi năm.",
                "Bảo hiểm sức khỏe cao cấp cho nhân viên và người thân, khám sức khỏe định kỳ.",
                "Ngân sách 12 triệu đồng/năm cho khoá học và chứng chỉ chuyên môn.",
                "Làm việc hybrid 2 ngày tại nhà mỗi tuần, thiết bị làm việc tự chọn."
            ]),
        new("0319876502", "Công ty CP Dữ liệu Mekong",
            "Mekong Data xây dựng nền tảng dữ liệu và báo cáo cho chuỗi bán lẻ, ngân hàng và doanh nghiệp sản xuất khu vực phía Nam. Công ty vận hành data warehouse hơn 40 tỷ bản ghi, cung cấp dashboard vận hành và mô hình dự báo cho hơn 60 khách hàng doanh nghiệp.",
            "Công nghệ thông tin", "100-200 nhân viên",
            "Quận 1, TP. Hồ Chí Minh", "https://mekongdata.example.com",
            "nền tảng dữ liệu và phân tích cho khách hàng doanh nghiệp",
            [
                "Thưởng theo dự án và KPI quý, xét tăng lương mỗi 6 tháng.",
                "Bảo hiểm y tế mở rộng, phụ cấp ăn trưa và gửi xe.",
                "Được tài trợ chứng chỉ nghề dữ liệu (Azure, Databricks, Power BI).",
                "Hybrid 3 ngày văn phòng, 2 ngày tại nhà; giờ làm việc linh hoạt."
            ]),
        new("0319876503", "Công ty TNHH Thương mại An Phát",
            "An Phát là nhà phân phối ngành hàng tiêu dùng nhanh tại miền Nam với hơn 2.500 điểm bán, hệ thống kho bãi tại TP. Hồ Chí Minh, Đồng Nai và Cần Thơ. Công ty đang mở rộng kênh bán hàng hiện đại và thương mại điện tử.",
            "Bán hàng / Kinh doanh", "20-50 nhân viên",
            "KCN Tân Bình, TP. Hồ Chí Minh", "https://anphat.example.com",
            "mạng lưới phân phối hàng tiêu dùng tại miền Nam",
            [
                "Hoa hồng kinh doanh không trần, thưởng nóng theo tháng đạt chỉ tiêu.",
                "Phụ cấp xăng xe, điện thoại và công tác phí đầy đủ.",
                "Bảo hiểm xã hội theo lương thực nhận, khám sức khỏe hằng năm.",
                "Lộ trình lên Giám sát khu vực sau 18 tháng gắn bó."
            ]),
        new("0319876504", "Công ty CP Logistics Sao Việt",
            "Sao Việt cung cấp dịch vụ logistics trọn gói: khai hải quan, kho ngoại quan, vận tải đường bộ và đường biển. Công ty vận hành 3 trung tâm phân phối tại Cát Lái, Sóng Thần và Long An với tổng diện tích 45.000 m².",
            "Logistics / Chuỗi cung ứng", "100-200 nhân viên",
            "Cảng Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh", "https://saovietlog.example.com",
            "dịch vụ kho vận và khai hải quan cho hàng xuất nhập khẩu",
            [
                "Lương tháng 13, thưởng hiệu suất theo sản lượng kho vận.",
                "Phụ cấp ca, cơm ca và hỗ trợ đi lại cho các chi nhánh.",
                "Đào tạo chứng chỉ khai hải quan, nghiệp vụ ngoại thương.",
                "Bảo hiểm đầy đủ, môi trường làm việc ổn định lâu dài."
            ]),
        new("0109876505", "Công ty TNHH Thiết kế Pixel House",
            "Pixel House là studio thiết kế thương hiệu và sản phẩm số tại Hà Nội, thực hiện hơn 200 dự án nhận diện thương hiệu, ứng dụng và website cho doanh nghiệp trong nước và Nhật Bản. Studio làm việc theo mô hình design sprint với khách hàng.",
            "Thiết kế / Đồ họa", "10-20 nhân viên",
            "Tây Hồ, Hà Nội", "https://pixelhouse.example.com",
            "dự án nhận diện thương hiệu và thiết kế sản phẩm số cho khách hàng doanh nghiệp",
            [
                "Thưởng theo dự án, review lương hai lần mỗi năm.",
                "Máy tính cấu hình cao, bản quyền phần mềm thiết kế đầy đủ.",
                "Không gian làm việc mở tại Tây Hồ, có phòng chụp và studio nội bộ.",
                "Ngân sách tham quan học hỏi và dự hội thảo thiết kế mỗi năm."
            ]),
        new("0109876506", "Công ty CP Tài chính Thịnh Vượng",
            "Thịnh Vượng cung cấp giải pháp tài chính tiêu dùng và tín dụng doanh nghiệp nhỏ với hơn 300.000 khách hàng đang vay. Bộ phận tín dụng, rủi ro và vận hành của công ty đang số hoá toàn bộ quy trình phê duyệt khoản vay.",
            "Tài chính / Ngân hàng", "200-500 nhân viên",
            "Hoàn Kiếm, Hà Nội", "https://thinhvuong.example.com",
            "sản phẩm tín dụng tiêu dùng và tài chính doanh nghiệp nhỏ",
            [
                "Thưởng KPI quý và tháng 13, xét tăng lương hằng năm theo khung.",
                "Bảo hiểm sức khỏe, bảo hiểm nhân thọ cho nhân viên chính thức.",
                "Đào tạo nội bộ về tín dụng, rủi ro và quy định pháp lý.",
                "Làm việc tại trung tâm Hà Nội, hỗ trợ gửi xe và ăn trưa."
            ]),
        new("5809876507", "Công ty TNHH Thực phẩm Xanh Farm",
            "Xanh Farm sản xuất và phân phối thực phẩm hữu cơ từ Đà Lạt: rau củ sơ chế, mứt và nước ép đóng chai. Nhà máy đạt chứng nhận ISO 22000, HACCP và đang mở rộng kênh siêu thị toàn quốc.",
            "Sản xuất / Nông nghiệp", "20-50 nhân viên",
            "Đà Lạt, Lâm Đồng", "https://xanhfarm.example.com",
            "chuỗi sản xuất và phân phối thực phẩm hữu cơ từ Đà Lạt",
            [
                "Lương tháng 13, thưởng nóng theo mùa vụ và doanh số.",
                "Cơm ca miễn phí, phụ cấp đi lại cho nhân viên nhà máy.",
                "Bảo hiểm đầy đủ, khám sức khỏe định kỳ theo quy định ngành thực phẩm.",
                "Hỗ trợ ký túc xá cho nhân sự từ tỉnh khác đến làm việc."
            ]),
        new("0109876508", "Công ty CP Giáo dục Tri Thức Việt",
            "Tri Thức Việt vận hành hệ thống trung tâm Anh ngữ và bồi dưỡng văn hoá với 12 cơ sở tại Hà Nội, phục vụ hơn 8.000 học viên mỗi năm. Trung tâm đang chuẩn hoá chương trình theo khung năng lực Cambridge và triển khai lớp học trực tuyến.",
            "Giáo dục / Đào tạo", "50-100 nhân viên",
            "Thanh Xuân, Hà Nội", "https://trithucviet.example.com",
            "chương trình đào tạo Anh ngữ và bồi dưỡng văn hoá cho học sinh phổ thông",
            [
                "Lương theo giờ dạy cộng thưởng học viên, tháng 13 đầy đủ.",
                "Được tài trợ học phí các khoá chứng chỉ giảng dạy.",
                "Lịch dạy linh hoạt, nghỉ hè theo lịch trung tâm.",
                "Bảo hiểm đầy đủ, ưu đãi học phí cho con em nhân viên."
            ]),
        new("0109876509", "Công ty TNHH Cơ khí Chính xác Đông Anh",
            "Đông Anh Mech gia công chính xác linh kiện cơ khí, khuôn mẫu cho ngành điện tử, ô tô và thiết bị công nghiệp. Nhà xưởng 6.000 m² với dàn máy CNC 3–5 trục, phục vụ khách hàng Nhật Bản và Hàn Quốc.",
            "Kỹ thuật / Sản xuất", "50-100 nhân viên",
            "Đông Anh, Hà Nội", "https://donganhmech.example.com",
            "gia công cơ khí chính xác và khuôn mẫu cho khách hàng công nghiệp",
            [
                "Lương tháng 13, thưởng sản lượng theo quý.",
                "Phụ cấp tay nghề, xăng xe và cơm ca.",
                "Đào tạo nâng bậc thợ, hỗ trợ chứng chỉ nghề.",
                "Bảo hiểm đầy đủ, xe đưa đón từ trung tâm Hà Nội."
            ]),
        new("4409876510", "Công ty CP Du lịch Biển Ngọc",
            "Biển Ngọc vận hành khách sạn 4 sao 120 phòng và trung tâm lữ hành tại Nha Trang, phục vụ khách đoàn nội địa và quốc tế. Công ty đang mở rộng mảng MICE và tour nghỉ dưỡng cao cấp.",
            "Du lịch / Khách sạn", "20-50 nhân viên",
            "Nha Trang, Khánh Hòa", "https://bienngoc.example.com",
            "khách sạn và trung tâm lữ hành phục vụ khách đoàn tại Nha Trang",
            [
                "Lương tháng 13, thưởng theo mùa cao điểm du lịch.",
                "Cơm ca, phụ cấp ngoại ngữ và phụ cấp ca đêm.",
                "Đào tạo nghiệp vụ khách sạn, tour và kỹ năng giao tiếp quốc tế.",
                "Bảo hiểm đầy đủ, ưu đãi nghỉ dưỡng cho nhân viên và gia đình."
            ])
    ];

    public static readonly DemoSkillSeed[] ExtraSkills =
    [
        new("AutoCAD", "Đọc và triển khai bản vẽ kỹ thuật 2D/3D bằng AutoCAD."),
        new("SolidWorks", "Dựng mô hình 3D linh kiện và lắp ghép cơ khí."),
        new("CNC Machining", "Vận hành và lập trình máy CNC gia công chính xác."),
        new("ISO 9001", "Vận hành hệ thống quản lý chất lượng theo ISO 9001."),
        new("HACCP", "Kiểm soát mối nguy và điểm kiểm soát tới hạn trong sản xuất thực phẩm."),
        new("Food Safety", "Tuân thủ quy định an toàn thực phẩm trong sản xuất và bảo quản."),
        new("Customs Declaration", "Khai báo hải quan và xử lý chứng từ xuất nhập khẩu."),
        new("Warehouse Management", "Tổ chức kho, kiểm kê và kiểm soát luân chuyển hàng hoá."),
        new("Inventory Control", "Theo dõi tồn kho, định mức và sai lệch kiểm kê."),
        new("Tour Operations", "Điều hành tour, sắp xếp lịch trình và xử lý tình huống tại điểm đến."),
        new("Hotel Operations", "Vận hành buồng phòng, lễ tân và dịch vụ khách sạn."),
        new("Teaching", "Giảng dạy theo giáo án và quản lý lớp học."),
        new("Lesson Planning", "Thiết kế giáo án và tài liệu học tập theo chuẩn đầu ra."),
        new("Academic Advising", "Tư vấn lộ trình học tập và theo dõi tiến độ học viên."),
        new("Credit Analysis", "Thẩm định hồ sơ vay và xếp hạng tín dụng khách hàng."),
        new("Risk Management", "Nhận diện, đo lường và kiểm soát rủi ro tín dụng, vận hành."),
        new("Internal Audit", "Kiểm toán nội bộ quy trình và tuân thủ."),
        new("Debt Collection", "Đàm phán và thu hồi nợ đúng quy định."),
        new("Brand Design", "Xây dựng nhận diện thương hiệu và hệ thống ấn phẩm."),
        new("Motion Graphics", "Dựng hoạt ảnh và đồ hoạ chuyển động cho nội dung số."),
        new("Supply Chain Planning", "Lập kế hoạch cung ứng, tồn kho và phân phối."),
        new("Purchasing", "Tìm nguồn, đàm phán giá và quản lý đơn mua hàng.")
    ];
}
