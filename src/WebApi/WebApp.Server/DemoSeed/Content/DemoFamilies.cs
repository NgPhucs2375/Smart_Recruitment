using Domain.Enums;

namespace WebApp.Server.DemoSeed.Content;

/// <summary>
/// Mười tám nhóm nghề dùng chung cho hai phía: biên tập JD của tin tuyển dụng và
/// dựng nội dung CV của ứng viên. Mọi tên kỹ năng ở đây phải có trong danh mục
/// chuẩn (DefaultDanhMucKyNang) hoặc trong DemoCompanies.ExtraSkills — bộ nạp
/// sẽ bỏ qua kỹ năng lạ thay vì tạo dữ liệu rác.
/// </summary>
internal static class DemoFamilies
{
    public static readonly DemoFamily[] All =
    [
        new("dotnet", "Lập trình viên .NET", "Backend Development", "tech-modern", "backend",
            "Lập trình viên .NET tập trung vào dịch vụ backend, API nghiệp vụ và tích hợp hệ thống cho sản phẩm dùng chung.",
            "Đội backend 6 người làm việc theo mô hình product team, phối hợp trực tiếp với frontend, QA và chủ sản phẩm trong sprint hai tuần.",
            "Công nghệ thông tin",
            ["FPT Software", "VNG Corporation", "NashTech Việt Nam"],
            ["Thực tập sinh .NET", "Lập trình viên .NET", "Lập trình viên .NET cao cấp"],
            [
                "Phát triển và bảo trì REST API bằng ASP.NET Core cho hệ thống quản trị nội bộ phục vụ hơn 5.000 người dùng.",
                "Thiết kế schema SQL Server, tối ưu truy vấn Entity Framework Core và xử lý các job đồng bộ dữ liệu định kỳ.",
                "Viết unit test, tham gia review code và phối hợp với QA để giảm lỗi hồi quy trước mỗi bản phát hành.",
                "Đóng gói dịch vụ bằng Docker, theo dõi log và xử lý sự cố trên môi trường staging và production."
            ],
            ["Hệ thống quản lý đơn hàng đa kênh", "Cổng thanh toán trực tuyến"],
            [
                "Xây dựng API ASP.NET Core phục vụ 20.000 đơn mỗi ngày, tích hợp cổng thanh toán và đồng bộ tồn kho giữa các kho.",
                "Thiết kế kiến trúc Clean Architecture, phân quyền theo vai trò và báo cáo doanh thu theo thời gian thực cho khối vận hành."
            ],
            ["Microsoft Certified: Azure Developer Associate", "Chứng chỉ Lập trình viên .NET"],
            [
                "Phát triển và bảo trì dịch vụ backend bằng .NET Core và ASP.NET Core.",
                "Thiết kế REST API, tích hợp hệ thống bên thứ ba và xử lý nghiệp vụ phức tạp.",
                "Làm việc với SQL Server hoặc PostgreSQL qua Entity Framework Core, tối ưu truy vấn chậm.",
                "Viết unit test, tham gia review code và đảm bảo chất lượng trước khi phát hành.",
                "Phối hợp với frontend, QA và chủ sản phẩm trong mô hình product team.",
                "Theo dõi log, xử lý sự cố và đề xuất cải tiến hiệu năng hệ thống."
            ],
            [
                "Tốt nghiệp ngành Công nghệ thông tin hoặc tương đương, có kinh nghiệm thực tế với .NET.",
                "Hiểu OOP, nguyên lý SOLID và cách tổ chức dự án theo Clean Architecture.",
                "Thành thạo C#, ASP.NET Core và Entity Framework Core.",
                "Có kinh nghiệm với SQL Server hoặc PostgreSQL và Git.",
                "Tư duy phân tích tốt, chủ động và đọc hiểu tài liệu tiếng Anh."
            ],
            [
                (".NET Core", MucDoYC.BatBuc), ("C#", MucDoYC.BatBuc), ("ASP.NET Core", MucDoYC.BatBuc),
                ("Entity Framework Core", MucDoYC.UuTien), ("SQL Server", MucDoYC.UuTien), ("REST API", MucDoYC.UuTien),
                ("Git", MucDoYC.UuTien), ("Docker", MucDoYC.KhongBatBuoc), ("Unit Testing", MucDoYC.KhongBatBuoc),
                ("Problem Solving", MucDoYC.KhongBatBuoc)
            ]),

        new("frontend", "Lập trình viên Frontend", "Frontend Development", "tech-modern", "frontend",
            "Lập trình viên Frontend xây dựng giao diện web nhanh, dễ tiếp cận và bám sát thiết kế sản phẩm.",
            "Đội frontend 5 người nhận thiết kế từ designer, phát triển component dùng chung và kiểm thử cùng QA mỗi sprint.",
            "Công nghệ thông tin",
            ["VNG Corporation", "Tiki", "KiotViet"],
            ["Thực tập sinh Frontend", "Lập trình viên Frontend", "Kỹ sư Frontend chính"],
            [
                "Phát triển giao diện bằng React và TypeScript cho ứng dụng web phục vụ hàng chục nghìn người dùng mỗi ngày.",
                "Xây dựng bộ component dùng chung, chuẩn hoá responsive và cải thiện điểm hiệu năng trên thiết bị di động.",
                "Phối hợp với designer để chuyển thiết kế Figma thành giao diện chính xác về khoảng cách, typography và tương tác.",
                "Kiểm thử trên nhiều trình duyệt, sửa lỗi hiển thị và bảo đảm giao diện đạt chuẩn tiếp cận cơ bản."
            ],
            ["Bảng điều khiển bán hàng đa kênh", "Website đặt lịch dịch vụ"],
            [
                "Xây dựng dashboard realtime bằng React, hiển thị doanh thu, tồn kho và hiệu suất bán hàng cho hơn 2.000 cửa hàng.",
                "Thiết kế luồng đặt lịch trực tuyến, tối ưu tốc độ tải trang và tỷ lệ hoàn tất đặt chỗ trên thiết bị di động."
            ],
            ["Meta Front-End Developer Professional Certificate", "Chứng chỉ React nâng cao"],
            [
                "Phát triển giao diện bằng React, TypeScript theo thiết kế đã được duyệt.",
                "Xây dựng component tái sử dụng và duy trì bộ design system của sản phẩm.",
                "Tối ưu hiệu năng tải trang, responsive và trải nghiệm trên thiết bị di động.",
                "Phối hợp với backend để tích hợp API và xử lý trạng thái tải, lỗi rõ ràng.",
                "Kiểm thử giao diện trên nhiều trình duyệt và mức thu phóng khác nhau.",
                "Tham gia review code và đóng góp cải tiến quy trình frontend."
            ],
            [
                "Có kinh nghiệm thực tế với JavaScript và React, hiểu vòng đời component.",
                "Nắm vững HTML, CSS, responsive và các vấn đề tương thích trình duyệt.",
                "Sử dụng thành thạo Git và quen với quy trình review code.",
                "Ưu tiên ứng viên biết TypeScript, Next.js và Tailwind CSS.",
                "Có ý thức về tiếp cận (accessibility) và chất lượng trải nghiệm người dùng."
            ],
            [
                ("JavaScript", MucDoYC.BatBuc), ("React", MucDoYC.BatBuc), ("HTML", MucDoYC.BatBuc),
                ("CSS", MucDoYC.UuTien), ("TypeScript", MucDoYC.UuTien), ("Next.js", MucDoYC.UuTien),
                ("Responsive Design", MucDoYC.UuTien), ("Git", MucDoYC.UuTien), ("Tailwind CSS", MucDoYC.KhongBatBuoc),
                ("Web Accessibility", MucDoYC.KhongBatBuoc)
            ]),

        new("fullstack", "Lập trình viên Full-stack", "Công nghệ thông tin", "tech-modern", "fullstack",
            "Lập trình viên Full-stack đảm nhận cả giao diện và dịch vụ backend cho sản phẩm quy mô vừa.",
            "Nhóm sản phẩm 4 người vận hành theo chu kỳ phát hành hai tuần, mỗi kỹ sư sở hữu trọn vẹn một tính năng từ cơ sở dữ liệu đến giao diện.",
            "Công nghệ thông tin",
            ["Base.vn", "MISA", "Sapo"],
            ["Thực tập sinh Full-stack", "Lập trình viên Full-stack", "Lập trình viên Full-stack cao cấp"],
            [
                "Phát triển tính năng trọn vẹn từ API Node.js đến giao diện React cho nền tảng quản trị doanh nghiệp.",
                "Thiết kế mô hình dữ liệu, viết truy vấn SQL và xử lý phân quyền theo vai trò.",
                "Tối ưu luồng dữ liệu giữa client và server, giảm thời gian phản hồi của các màn hình nặng.",
                "Viết tài liệu kỹ thuật, kiểm thử tích hợp và hỗ trợ vận hành khi phát hành."
            ],
            ["Nền tảng quản trị nhân sự", "Ứng dụng quản lý dự án nội bộ"],
            [
                "Xây dựng module chấm công và tính lương cho doanh nghiệp 500 nhân sự, đồng bộ dữ liệu với máy chấm công.",
                "Phát triển ứng dụng quản lý công việc theo Kanban, thông báo realtime và báo cáo tiến độ cho quản lý dự án."
            ],
            ["Chứng chỉ JavaScript nâng cao", "AWS Certified Cloud Practitioner"],
            [
                "Phát triển tính năng từ giao diện đến API và cơ sở dữ liệu.",
                "Thiết kế và tối ưu truy vấn SQL cho các màn hình nghiệp vụ.",
                "Xây dựng API REST, xử lý xác thực và phân quyền.",
                "Viết kiểm thử tích hợp và tài liệu kỹ thuật cho tính năng.",
                "Phối hợp với designer, QA và vận hành để phát hành đúng hạn.",
                "Theo dõi chất lượng mã nguồn và đề xuất cải tiến kiến trúc."
            ],
            [
                "Có kinh nghiệm thực tế cả frontend và backend, hiểu cách hai phía trao đổi dữ liệu.",
                "Thành thạo JavaScript, React và một framework backend như Node.js.",
                "Hiểu SQL, thiết kế bảng và tối ưu truy vấn cơ bản.",
                "Quen với Git, Docker và quy trình phát hành sản phẩm.",
                "Chủ động, giao tiếp tốt và có tinh thần sở hữu tính năng."
            ],
            [
                ("JavaScript", MucDoYC.BatBuc), ("Node.js", MucDoYC.BatBuc), ("React", MucDoYC.UuTien),
                ("SQL", MucDoYC.BatBuc), ("REST API", MucDoYC.BatBuc), ("Docker", MucDoYC.KhongBatBuoc),
                ("Git", MucDoYC.UuTien), ("HTML", MucDoYC.UuTien), ("TypeScript", MucDoYC.UuTien),
                ("Problem Solving", MucDoYC.KhongBatBuoc)
            ]),

        new("data", "Chuyên viên Phân tích dữ liệu", "Data Science & Analytics", "data-specialist", "data",
            "Chuyên viên phân tích dữ liệu chuyển dữ liệu vận hành thành báo cáo và khuyến nghị có thể hành động.",
            "Đội phân tích 7 người phục vụ nhiều đơn vị kinh doanh, làm việc trực tiếp với chủ sản phẩm và vận hành để chốt chỉ số.",
            "Hệ thống thông tin quản lý",
            ["Mekong Data", "Vinamilk", "Techcombank"],
            ["Thực tập sinh Phân tích dữ liệu", "Chuyên viên Phân tích dữ liệu", "Chuyên viên Phân tích dữ liệu cao cấp"],
            [
                "Xây dựng dashboard Power BI theo dõi doanh thu, tồn kho và hành vi khách hàng cho khối kinh doanh.",
                "Viết truy vấn SQL phức tạp, chuẩn hoá dữ liệu nguồn và xử lý sai lệch giữa các hệ thống.",
                "Phân tích nguyên nhân biến động chỉ số, trình bày kết quả bằng biểu đồ dễ hiểu cho người không kỹ thuật.",
                "Phối hợp với đội dữ liệu để tự động hoá báo cáo định kỳ và giảm thao tác thủ công."
            ],
            ["Dashboard vận hành chuỗi bán lẻ", "Mô hình dự báo nhu cầu theo tuần"],
            [
                "Xây dựng bộ dashboard theo dõi doanh thu, tỷ lệ chuyển đổi và tồn kho cho hơn 60 cửa hàng.",
                "Phân tích dữ liệu bán hàng ba năm và xây dựng mô hình dự báo nhu cầu giúp giảm tồn kho chậm luân chuyển."
            ],
            ["Google Data Analytics Professional Certificate", "Microsoft Certified: Power BI Data Analyst"],
            [
                "Khai thác dữ liệu từ kho dữ liệu và hệ thống vận hành bằng SQL.",
                "Xây dựng báo cáo, dashboard trên Power BI hoặc công cụ tương đương.",
                "Phân tích chỉ số kinh doanh và giải thích nguyên nhân biến động.",
                "Làm sạch dữ liệu, kiểm tra tính đúng đắn trước khi công bố báo cáo.",
                "Phối hợp với đơn vị kinh doanh để thống nhất định nghĩa chỉ số.",
                "Trình bày kết quả bằng ngôn ngữ dễ hiểu cho người ra quyết định."
            ],
            [
                "Có kinh nghiệm phân tích dữ liệu trong môi trường doanh nghiệp.",
                "Thành thạo SQL và Excel; biết Power BI là lợi thế.",
                "Hiểu thống kê cơ bản và cách đọc biểu đồ.",
                "Tư duy phản biện, kiểm tra số liệu trước khi kết luận.",
                "Giao tiếp tốt, biết kể câu chuyện từ dữ liệu."
            ],
            [
                ("SQL", MucDoYC.BatBuc), ("Excel", MucDoYC.BatBuc), ("Power BI", MucDoYC.UuTien),
                ("Python", MucDoYC.UuTien), ("Data Visualization", MucDoYC.UuTien), ("Statistics", MucDoYC.KhongBatBuoc),
                ("Analytical Problem-Solving", MucDoYC.UuTien), ("Communication", MucDoYC.KhongBatBuoc),
                ("ETL", MucDoYC.KhongBatBuoc), ("Attention to Detail", MucDoYC.UuTien)
            ]),

        new("devops", "Kỹ sư DevOps", "Công nghệ thông tin", "tech-modern", "infra",
            "Kỹ sư DevOps chịu trách nhiệm hạ tầng, pipeline triển khai và độ ổn định của hệ thống.",
            "Đội hạ tầng 4 người vận hành nền tảng container, trực on-call luân phiên và phối hợp với các nhóm sản phẩm khi phát hành.",
            "Công nghệ thông tin",
            ["VNG Corporation", "Grab Việt Nam", "Viettel Solutions"],
            ["Thực tập sinh DevOps", "Kỹ sư DevOps", "Kỹ sư DevOps cao cấp"],
            [
                "Duy trì pipeline CI/CD tự động build, kiểm thử và triển khai dịch vụ lên môi trường staging và production.",
                "Quản lý hạ tầng container trên Kubernetes, cấu hình autoscaling và giám sát tài nguyên.",
                "Thiết lập giám sát, cảnh báo và quy trình xử lý sự cố cho các dịch vụ trọng yếu.",
                "Chuẩn hoá hạ tầng bằng Terraform, tài liệu hoá runbook và giảm thao tác thủ công."
            ],
            ["Hạ tầng triển khai đa môi trường", "Hệ thống giám sát và cảnh báo dịch vụ"],
            [
                "Xây dựng pipeline CI/CD cho hơn 20 dịch vụ, rút ngắn thời gian phát hành từ vài giờ xuống dưới 20 phút.",
                "Thiết lập giám sát tập trung, cảnh báo theo ngưỡng và dashboard sức khoẻ hệ thống cho đội vận hành."
            ],
            ["Certified Kubernetes Administrator (CKA)", "AWS Certified Solutions Architect – Associate"],
            [
                "Xây dựng và duy trì pipeline CI/CD cho các dịch vụ backend và frontend.",
                "Quản lý hạ tầng container, cấu hình mạng và lưu trữ.",
                "Thiết lập giám sát, cảnh báo và xử lý sự cố hệ thống.",
                "Tự động hoá hạ tầng bằng công cụ khai báo như Terraform.",
                "Phối hợp với nhóm phát triển để chuẩn hoá quy trình phát hành.",
                "Đảm bảo sao lưu, bảo mật và khả năng phục hồi của hệ thống."
            ],
            [
                "Có kinh nghiệm vận hành Linux và container trong môi trường thật.",
                "Thành thạo Docker, CI/CD và Git.",
                "Hiểu Kubernetes, mạng và lưu trữ trong hệ thống phân tán.",
                "Biết một nền tảng đám mây (AWS hoặc Azure) và công cụ giám sát.",
                "Sẵn sàng trực on-call và xử lý sự cố ngoài giờ khi cần."
            ],
            [
                ("Linux", MucDoYC.BatBuc), ("Docker", MucDoYC.BatBuc), ("CI/CD", MucDoYC.BatBuc),
                ("Kubernetes", MucDoYC.UuTien), ("Terraform", MucDoYC.UuTien), ("AWS", MucDoYC.UuTien),
                ("Monitoring", MucDoYC.KhongBatBuoc), ("Git", MucDoYC.UuTien), ("Azure", MucDoYC.KhongBatBuoc),
                ("Problem Solving", MucDoYC.UuTien)
            ]),

        new("qa", "Kỹ sư Kiểm thử (QA/QC)", "Kiểm thử / QA", "clean-corporate", "quality",
            "Kỹ sư kiểm thử bảo đảm chất lượng bản phát hành bằng kịch bản rõ ràng và phối hợp chặt với đội phát triển.",
            "Đội QA 5 người tham gia từ giai đoạn phân tích yêu cầu, thiết kế test case và kiểm thử hồi quy trước mỗi bản phát hành.",
            "Công nghệ thông tin",
            ["FPT Software", "KMS Technology", "NashTech Việt Nam"],
            ["Thực tập sinh QA", "Kỹ sư Kiểm thử", "Kỹ sư Kiểm thử cao cấp"],
            [
                "Thiết kế và thực thi test case cho các tính năng web và API theo yêu cầu nghiệp vụ.",
                "Ghi nhận lỗi có bước tái hiện rõ ràng, theo dõi đến khi được sửa và kiểm thử lại.",
                "Thực hiện kiểm thử hồi quy, kiểm thử khám phá và kiểm thử trên nhiều thiết bị.",
                "Tham gia review yêu cầu sớm để phát hiện lỗ hổng logic trước khi phát triển."
            ],
            ["Bộ kiểm thử hồi quy nền tảng web", "Kiểm thử API thanh toán"],
            [
                "Xây dựng bộ test case hồi quy cho nền tảng quản trị, giảm số lỗi lọt ra production mỗi quý.",
                "Thiết kế kịch bản kiểm thử API thanh toán, bao phủ các trường hợp lỗi và giao dịch hoàn tiền."
            ],
            ["ISTQB Certified Tester Foundation Level", "Chứng chỉ Kiểm thử API"],
            [
                "Phân tích yêu cầu và thiết kế test case cho tính năng mới.",
                "Thực thi kiểm thử chức năng, hồi quy và kiểm thử khám phá.",
                "Ghi nhận, phân loại và theo dõi lỗi đến khi đóng.",
                "Kiểm thử API bằng công cụ phù hợp và đối chiếu dữ liệu với SQL.",
                "Phối hợp với lập trình viên để tái hiện và xác minh bản sửa.",
                "Đề xuất cải tiến quy trình kiểm thử và tự động hoá bước lặp lại."
            ],
            [
                "Có kinh nghiệm kiểm thử phần mềm web hoặc API.",
                "Hiểu quy trình kiểm thử, mức độ ưu tiên lỗi và tiêu chí nghiệm thu.",
                "Biết viết test case rõ ràng, dễ tái sử dụng.",
                "Có kiến thức SQL cơ bản để đối chiếu dữ liệu.",
                "Tỉ mỉ, kiên nhẫn và giao tiếp tốt với đội phát triển."
            ],
            [
                ("Test Case Design", MucDoYC.BatBuc), ("Manual Testing", MucDoYC.BatBuc), ("Bug Reporting", MucDoYC.UuTien),
                ("SQL", MucDoYC.UuTien), ("Test Automation", MucDoYC.KhongBatBuoc), ("Playwright", MucDoYC.KhongBatBuoc),
                ("Attention to Detail", MucDoYC.UuTien), ("Communication", MucDoYC.KhongBatBuoc),
                ("Problem Solving", MucDoYC.KhongBatBuoc)
            ]),

        new("design", "Nhà thiết kế UI/UX", "Thiết kế / Đồ họa", "creative-portfolio", "design",
            "Nhà thiết kế UI/UX chuyển yêu cầu sản phẩm thành giao diện rõ ràng, nhất quán và dễ sử dụng.",
            "Studio thiết kế 4 người làm việc theo design sprint với khách hàng, phối hợp cùng frontend để bàn giao thiết kế chính xác.",
            "Thiết kế đồ hoạ",
            ["Pixel House", "Vietnam Design Group", "TMA Solutions"],
            ["Thực tập sinh Thiết kế", "Nhà thiết kế UI/UX", "Nhà thiết kế UI/UX cao cấp"],
            [
                "Thiết kế giao diện ứng dụng web và di động bằng Figma, bảo đảm nhất quán với design system.",
                "Nghiên cứu người dùng, phỏng vấn ngắn và phân tích hành vi để cải thiện luồng sử dụng.",
                "Dựng prototype tương tác để kiểm thử ý tưởng với khách hàng trước khi phát triển.",
                "Phối hợp với frontend để rà soát bản dựng và giữ đúng khoảng cách, màu sắc, typography."
            ],
            ["Ứng dụng đặt lịch dịch vụ", "Hệ thống nhận diện thương hiệu"],
            [
                "Thiết kế lại luồng đặt lịch cho ứng dụng di động, giảm số bước thao tác và tăng tỷ lệ hoàn tất.",
                "Xây dựng bộ nhận diện và hướng dẫn sử dụng thương hiệu cho doanh nghiệp dịch vụ nhiều chi nhánh."
            ],
            ["Google UX Design Professional Certificate", "Chứng chỉ Thiết kế Design System"],
            [
                "Thiết kế giao diện và luồng tương tác cho sản phẩm web và di động.",
                "Xây dựng và duy trì design system, component thống nhất.",
                "Thực hiện nghiên cứu người dùng và kiểm thử khả dụng.",
                "Dựng prototype để trình bày và kiểm chứng ý tưởng.",
                "Phối hợp với frontend để bàn giao và rà soát bản dựng.",
                "Trình bày phương án thiết kế trước khách hàng và đội sản phẩm."
            ],
            [
                "Có portfolio thể hiện quy trình thiết kế, không chỉ ảnh giao diện.",
                "Thành thạo Figma và nguyên tắc thiết kế giao diện.",
                "Hiểu nghiên cứu người dùng và cách kiểm thử khả dụng.",
                "Có khả năng xây dựng design system và làm việc với frontend.",
                "Giao tiếp tốt, biết bảo vệ phương án dựa trên dữ liệu."
            ],
            [
                ("Figma", MucDoYC.BatBuc), ("UI Design", MucDoYC.BatBuc), ("Design System", MucDoYC.UuTien),
                ("UX Research", MucDoYC.UuTien), ("Prototyping", MucDoYC.UuTien), ("Communication", MucDoYC.KhongBatBuoc),
                ("Brand Design", MucDoYC.KhongBatBuoc), ("Motion Graphics", MucDoYC.KhongBatBuoc),
                ("Attention to Detail", MucDoYC.UuTien)
            ]),

        new("hr", "Chuyên viên Nhân sự", "Nhân sự", "clean-corporate", "people",
            "Chuyên viên nhân sự phụ trách tuyển dụng, hồ sơ nhân sự và các hoạt động gắn kết nhân viên.",
            "Phòng nhân sự 5 người phục vụ doanh nghiệp vài trăm nhân sự, phối hợp với trưởng bộ phận trong từng đợt tuyển.",
            "Quản trị nhân lực",
            ["Công ty CP Nhân lực Sài Gòn", "Bảo Việt Nhân Thọ", "Đất Xanh Group"],
            ["Thực tập sinh Nhân sự", "Chuyên viên Nhân sự", "Chuyên viên Nhân sự cao cấp"],
            [
                "Quản lý tuyển dụng từ đăng tin, sàng lọc hồ sơ, hẹn phỏng vấn đến theo dõi nhận việc.",
                "Quản lý hồ sơ nhân sự, hợp đồng lao động và các thủ tục bảo hiểm theo quy định.",
                "Tổ chức hoạt động gắn kết, khảo sát mức độ hài lòng và đề xuất cải thiện môi trường làm việc.",
                "Chuẩn bị báo cáo nhân sự định kỳ và hỗ trợ tính lương khi cần."
            ],
            ["Quy trình tuyển dụng chuẩn hoá", "Chương trình gắn kết nhân viên"],
            [
                "Chuẩn hoá quy trình tuyển dụng từ 7 bước rườm rà thành 4 bước, rút ngắn thời gian tuyển trung bình xuống còn 18 ngày.",
                "Triển khai chương trình gắn kết và khảo sát nội bộ, nâng mức độ hài lòng của nhân viên qua hai kỳ đánh giá."
            ],
            ["Chứng chỉ Nghiệp vụ Nhân sự (SHRM-CP)", "Chứng chỉ Luật Lao động"],
            [
                "Thực hiện tuyển dụng từ đăng tin đến bố trí nhân sự mới.",
                "Sàng lọc hồ sơ, sắp xếp phỏng vấn và phản hồi ứng viên đúng hẹn.",
                "Quản lý hồ sơ, hợp đồng và thủ tục bảo hiểm cho nhân viên.",
                "Tư vấn chính sách nhân sự cho trưởng bộ phận.",
                "Tổ chức hoạt động gắn kết và khảo sát nội bộ.",
                "Lập báo cáo nhân sự phục vụ ban lãnh đạo."
            ],
            [
                "Có kinh nghiệm tuyển dụng và quản trị nhân sự.",
                "Hiểu quy định pháp luật lao động và bảo hiểm.",
                "Giao tiếp tốt, xử lý thông tin nhạy cảm cẩn thận.",
                "Thành thạo Excel và công cụ quản lý hồ sơ.",
                "Chủ động, biết sắp xếp nhiều đầu việc song song."
            ],
            [
                ("Recruitment", MucDoYC.BatBuc), ("Interviewing", MucDoYC.BatBuc), ("HR Administration", MucDoYC.UuTien),
                ("Communication", MucDoYC.UuTien), ("Employee Relations", MucDoYC.KhongBatBuoc), ("Excel", MucDoYC.KhongBatBuoc),
                ("Payroll", MucDoYC.KhongBatBuoc), ("Time Management", MucDoYC.UuTien),
                ("Critical Thinking", MucDoYC.KhongBatBuoc)
            ]),

        new("sales", "Nhân viên Kinh doanh", "Bán hàng / Kinh doanh", "clean-corporate", "sales",
            "Nhân viên kinh doanh phát triển khách hàng, tư vấn giải pháp và chốt đơn theo chỉ tiêu.",
            "Đội kinh doanh theo khu vực, làm việc trực tiếp với quản lý vùng và bộ phận vận hành để giữ dịch vụ sau bán.",
            "Quản trị kinh doanh",
            ["An Phát Distribution", "Thế Giới Di Động", "Vietcombank"],
            ["Thực tập sinh Kinh doanh", "Nhân viên Kinh doanh", "Giám sát Kinh doanh"],
            [
                "Tìm kiếm khách hàng mới, tư vấn sản phẩm và chốt đơn theo chỉ tiêu được giao.",
                "Chăm sóc khách hàng hiện hữu, xử lý phản hồi và duy trì quan hệ hợp tác dài hạn.",
                "Cập nhật cơ hội bán hàng lên CRM, báo cáo doanh số và dự báo tuần.",
                "Phối hợp với vận hành để bảo đảm đơn hàng giao đúng hẹn và xử lý khiếu nại."
            ],
            ["Mở rộng khách hàng khu vực miền Nam", "Chương trình bán hàng doanh nghiệp"],
            [
                "Phát triển 45 khách hàng doanh nghiệp mới trong một năm, hoàn thành 118% chỉ tiêu doanh số.",
                "Xây dựng danh sách khách hàng tiềm năng theo ngành và quy trình chăm sóc định kỳ bằng CRM."
            ],
            ["Chứng chỉ Kỹ năng Bán hàng Chuyên nghiệp", "Chứng chỉ Đàm phán Thương lượng"],
            [
                "Tìm kiếm và phát triển khách hàng mới theo chỉ tiêu.",
                "Tư vấn sản phẩm, báo giá và đàm phán điều khoản bán hàng.",
                "Chăm sóc khách hàng hiện hữu và xử lý phản hồi.",
                "Cập nhật CRM và báo cáo tiến độ bán hàng.",
                "Phối hợp với vận hành để giao hàng đúng cam kết.",
                "Đề xuất phương án mở rộng thị trường theo khu vực."
            ],
            [
                "Có kinh nghiệm bán hàng trực tiếp hoặc bán hàng doanh nghiệp.",
                "Giao tiếp tốt, tự tin thương lượng và chăm sóc khách hàng.",
                "Biết sử dụng CRM và báo cáo doanh số.",
                "Có tinh thần chịu áp lực chỉ tiêu và chủ động học sản phẩm.",
                "Ưu tiên ứng viên có mạng lưới khách hàng trong ngành."
            ],
            [
                ("Sales", MucDoYC.BatBuc), ("Negotiation", MucDoYC.UuTien), ("CRM", MucDoYC.UuTien),
                ("Lead Generation", MucDoYC.KhongBatBuoc), ("Customer Service", MucDoYC.UuTien), ("Communication", MucDoYC.UuTien),
                ("Time Management", MucDoYC.KhongBatBuoc), ("Problem Solving", MucDoYC.KhongBatBuoc),
                ("English", MucDoYC.KhongBatBuoc)
            ]),

        new("accounting", "Kế toán tổng hợp", "Tài chính / Kế toán", "clean-corporate", "finance",
            "Kế toán tổng hợp phụ trách hạch toán, báo cáo tài chính và tuân thủ nghĩa vụ thuế.",
            "Phòng kế toán 6 người làm việc theo kỳ tháng, phối hợp với kinh doanh và kho vận để đối chiếu số liệu.",
            "Kế toán",
            ["Công ty Kiểm toán A&C", "Thịnh Vượng Finance", "Minh Phát Trading"],
            ["Thực tập sinh Kế toán", "Kế toán tổng hợp", "Kế toán trưởng"],
            [
                "Hạch toán doanh thu, chi phí và theo dõi công nợ phải thu, phải trả.",
                "Lập báo cáo tài chính tháng, quý và chuẩn bị hồ sơ cho kiểm toán.",
                "Kê khai thuế giá trị gia tăng, thuế thu nhập doanh nghiệp đúng hạn.",
                "Đối chiếu sổ kế toán với kho vận và ngân hàng, xử lý chênh lệch kịp thời."
            ],
            ["Chuẩn hoá sổ sách kế toán", "Triển khai phần mềm kế toán"],
            [
                "Chuẩn hoá sổ sách và quy trình đối chiếu công nợ cho doanh nghiệp thương mại có ba kho.",
                "Chuyển đổi dữ liệu kế toán sang phần mềm mới, bảo đảm số dư đầu kỳ khớp với báo cáo cũ."
            ],
            ["Chứng chỉ Kế toán trưởng", "Chứng chỉ Tin học Kế toán"],
            [
                "Hạch toán nghiệp vụ kinh tế phát sinh và theo dõi công nợ.",
                "Lập báo cáo tài chính, báo cáo thuế đúng kỳ.",
                "Đối chiếu sổ sách với kho, ngân hàng và nhà cung cấp.",
                "Chuẩn bị hồ sơ, số liệu cho kiểm toán và cơ quan thuế.",
                "Theo dõi thay đổi chính sách thuế và áp dụng kịp thời.",
                "Hỗ trợ phân tích chi phí phục vụ quản trị."
            ],
            [
                "Có kinh nghiệm kế toán tổng hợp hoặc kế toán bán hàng.",
                "Nắm vững chế độ kế toán và quy định thuế hiện hành.",
                "Thành thạo Excel và phần mềm kế toán.",
                "Cẩn thận, trung thực và chịu được áp lực kỳ báo cáo.",
                "Ưu tiên ứng viên có chứng chỉ kế toán trưởng."
            ],
            [
                ("Accounting", MucDoYC.BatBuc), ("Tax Regulations", MucDoYC.BatBuc), ("Excel", MucDoYC.BatBuc),
                ("Invoice Processing", MucDoYC.UuTien), ("Auditing", MucDoYC.KhongBatBuoc), ("Attention to Detail", MucDoYC.UuTien),
                ("Internal Audit", MucDoYC.KhongBatBuoc), ("Time Management", MucDoYC.UuTien),
                ("Communication", MucDoYC.KhongBatBuoc)
            ]),

        new("marketing", "Chuyên viên Marketing", "Marketing / Truyền thông", "creative-portfolio", "growth",
            "Chuyên viên marketing lập kế hoạch, triển khai và đo lường chiến dịch tiếp thị đa kênh.",
            "Đội marketing 5 người phối hợp với kinh doanh và thiết kế, vận hành chiến dịch theo tháng và báo cáo hiệu quả theo kênh.",
            "Marketing",
            ["An Phát Distribution", "Sendo", "Golden Gate"],
            ["Thực tập sinh Marketing", "Chuyên viên Marketing", "Trưởng nhóm Marketing"],
            [
                "Lập kế hoạch nội dung và triển khai chiến dịch trên Facebook, Google và kênh email.",
                "Viết nội dung quảng cáo, phối hợp thiết kế ấn phẩm và kiểm duyệt trước khi phát hành.",
                "Theo dõi ngân sách, đo lường hiệu quả theo kênh và tối ưu chi phí chuyển đổi.",
                "Phân tích đối thủ, khảo sát khách hàng và đề xuất thông điệp phù hợp từng nhóm."
            ],
            ["Chiến dịch ra mắt sản phẩm", "Chương trình khách hàng thân thiết"],
            [
                "Triển khai chiến dịch ra mắt sản phẩm đa kênh, tăng lượng truy cập và đơn hàng trong tháng đầu.",
                "Xây dựng chương trình khách hàng thân thiết, chuẩn hoá nội dung email và báo cáo giữ chân khách hàng."
            ],
            ["Google Ads Search Certification", "Meta Certified Digital Marketing Associate"],
            [
                "Lập kế hoạch và triển khai chiến dịch marketing đa kênh.",
                "Sản xuất nội dung quảng cáo, bài viết và ấn phẩm truyền thông.",
                "Quản lý ngân sách và tối ưu hiệu quả theo chỉ số chuyển đổi.",
                "Phối hợp với thiết kế và kinh doanh để thống nhất thông điệp.",
                "Đo lường, báo cáo hiệu quả chiến dịch định kỳ.",
                "Nghiên cứu thị trường và đối thủ để đề xuất hướng tiếp cận."
            ],
            [
                "Có kinh nghiệm triển khai chiến dịch marketing thực tế.",
                "Viết nội dung tốt, hiểu tâm lý khách hàng mục tiêu.",
                "Biết đọc số liệu quảng cáo và tối ưu ngân sách.",
                "Thành thạo công cụ quảng cáo và Excel.",
                "Chủ động, sáng tạo và phối hợp tốt với các nhóm khác."
            ],
            [
                ("Marketing", MucDoYC.BatBuc), ("Content Creation", MucDoYC.UuTien), ("SEO", MucDoYC.KhongBatBuoc),
                ("Communication", MucDoYC.UuTien), ("Excel", MucDoYC.KhongBatBuoc), ("Sales", MucDoYC.KhongBatBuoc),
                ("Critical Thinking", MucDoYC.UuTien), ("Time Management", MucDoYC.KhongBatBuoc),
                ("Brand Design", MucDoYC.KhongBatBuoc)
            ]),

        new("logistics", "Chuyên viên Logistics / Kho vận", "Kho vận / Logistics", "ats-classic", "logistics",
            "Chuyên viên logistics điều phối kho vận, chứng từ xuất nhập khẩu và luồng giao hàng.",
            "Trung tâm phân phối vận hành nhiều ca, phối hợp với hải quan, đơn vị vận tải và bộ phận kinh doanh để giữ tiến độ giao hàng.",
            "Logistics và Quản lý chuỗi cung ứng",
            ["Sao Việt Logistics", "DHL Việt Nam", "Viettel Post"],
            ["Thực tập sinh Logistics", "Chuyên viên Logistics", "Giám sát Kho vận"],
            [
                "Theo dõi đơn hàng xuất nhập khẩu, chuẩn bị chứng từ và phối hợp khai báo hải quan.",
                "Điều phối xuất nhập kho, kiểm kê định kỳ và kiểm soát sai lệch tồn kho.",
                "Lập kế hoạch giao hàng, làm việc với đơn vị vận tải để giữ cam kết thời gian.",
                "Theo dõi chi phí vận chuyển, lưu kho và đề xuất phương án tối ưu."
            ],
            ["Tối ưu luồng xuất nhập kho", "Hệ thống theo dõi đơn hàng xuất khẩu"],
            [
                "Sắp xếp lại luồng xuất nhập kho, giảm thời gian lấy hàng và hạn chế nhầm lẫn mã hàng.",
                "Theo dõi đơn hàng xuất khẩu theo lô, chuẩn hoá chứng từ và giảm thời gian thông quan trung bình."
            ],
            ["Chứng chỉ Nghiệp vụ Khai hải quan", "Chứng chỉ Quản lý Kho vận"],
            [
                "Chuẩn bị và kiểm tra chứng từ xuất nhập khẩu.",
                "Phối hợp khai báo hải quan và theo dõi thông quan.",
                "Điều phối xuất nhập kho, kiểm kê và kiểm soát tồn kho.",
                "Lập kế hoạch giao hàng và theo dõi tiến độ vận chuyển.",
                "Đối chiếu chi phí vận chuyển, lưu kho với nhà cung cấp.",
                "Xử lý phát sinh và báo cáo tình hình kho vận định kỳ."
            ],
            [
                "Có kinh nghiệm kho vận hoặc xuất nhập khẩu.",
                "Hiểu quy trình chứng từ và khai báo hải quan.",
                "Thành thạo Excel, cẩn thận với số liệu tồn kho.",
                "Chịu được áp lực cao điểm và phối hợp tốt với đối tác.",
                "Ưu tiên ứng viên có chứng chỉ nghiệp vụ hải quan."
            ],
            [
                ("Customs Declaration", MucDoYC.BatBuc), ("Warehouse Management", MucDoYC.BatBuc), ("Inventory Control", MucDoYC.UuTien),
                ("Excel", MucDoYC.UuTien), ("Supply Chain Planning", MucDoYC.KhongBatBuoc), ("Purchasing", MucDoYC.KhongBatBuoc),
                ("Communication", MucDoYC.UuTien), ("Attention to Detail", MucDoYC.UuTien),
                ("Time Management", MucDoYC.KhongBatBuoc)
            ]),

        new("mechanical", "Kỹ thuật viên Cơ khí CNC", "Sản xuất / Kỹ thuật", "ats-classic", "plant",
            "Kỹ thuật viên cơ khí vận hành máy CNC, đọc bản vẽ và bảo đảm dung sai chi tiết gia công.",
            "Nhà xưởng 6.000 m² vận hành nhiều tổ sản xuất, phối hợp với bộ phận QC và kỹ sư thiết kế để đạt tiến độ đơn hàng.",
            "Cơ khí chế tạo máy",
            ["Đông Anh Mech", "VinFast", "Bosch Việt Nam"],
            ["Thực tập sinh Cơ khí", "Kỹ thuật viên CNC", "Kỹ sư Cơ khí"],
            [
                "Vận hành máy CNC 3 đến 5 trục, lập trình gia công theo bản vẽ kỹ thuật.",
                "Đọc bản vẽ 2D/3D, kiểm tra dung sai và hiệu chỉnh chương trình khi cần.",
                "Bảo dưỡng máy định kỳ, theo dõi tình trạng dao cụ và đề xuất thay thế.",
                "Phối hợp với QC để xử lý chi tiết lỗi và cải tiến quy trình gia công."
            ],
            ["Gia công linh kiện ô tô", "Bộ khuôn mẫu thiết bị công nghiệp"],
            [
                "Gia công linh kiện cơ khí chính xác cho khách hàng Nhật Bản, bảo đảm dung sai theo bản vẽ.",
                "Tham gia chế tạo bộ khuôn mẫu cho thiết bị công nghiệp, phối hợp thử nghiệm và hiệu chỉnh."
            ],
            ["Chứng chỉ Kỹ thuật viên CNC", "Chứng chỉ An toàn Lao động"],
            [
                "Vận hành máy CNC và gia công chi tiết theo bản vẽ.",
                "Đọc bản vẽ kỹ thuật, kiểm tra dung sai và hiệu chỉnh chương trình.",
                "Bảo dưỡng máy và quản lý dao cụ trong ca sản xuất.",
                "Kiểm tra chất lượng chi tiết và phối hợp xử lý lỗi.",
                "Tuân thủ quy định an toàn lao động và 5S tại xưởng.",
                "Đề xuất cải tiến năng suất và giảm hao phí vật tư."
            ],
            [
                "Có kinh nghiệm vận hành máy CNC hoặc gia công cơ khí.",
                "Đọc hiểu bản vẽ kỹ thuật và đo lường dung sai.",
                "Biết AutoCAD hoặc SolidWorks là lợi thế.",
                "Cẩn thận, kiên trì và tuân thủ an toàn lao động.",
                "Sẵn sàng làm việc theo ca sản xuất."
            ],
            [
                ("CNC Machining", MucDoYC.BatBuc), ("AutoCAD", MucDoYC.BatBuc), ("SolidWorks", MucDoYC.UuTien),
                ("ISO 9001", MucDoYC.KhongBatBuoc), ("Problem Solving", MucDoYC.UuTien), ("Attention to Detail", MucDoYC.UuTien),
                ("Teamwork", MucDoYC.KhongBatBuoc), ("Time Management", MucDoYC.KhongBatBuoc)
            ]),

        new("food", "Kỹ thuật viên Sản xuất Thực phẩm", "Sản xuất / Kỹ thuật", "ats-classic", "plant",
            "Kỹ thuật viên sản xuất thực phẩm vận hành dây chuyền, kiểm soát chất lượng và an toàn thực phẩm.",
            "Nhà máy đạt chứng nhận ISO 22000 và HACCP, sản xuất theo mùa vụ và phối hợp chặt với bộ phận QC và kho.",
            "Công nghệ thực phẩm",
            ["Xanh Farm", "Vinamilk", "TH True Milk"],
            ["Thực tập sinh Sản xuất", "Kỹ thuật viên Sản xuất", "Quản lý Chất lượng"],
            [
                "Vận hành dây chuyền sơ chế và đóng gói thực phẩm theo quy trình chuẩn.",
                "Kiểm tra nguyên liệu đầu vào, theo dõi nhiệt độ và vệ sinh thiết bị theo HACCP.",
                "Ghi chép hồ sơ sản xuất, lấy mẫu kiểm nghiệm và phối hợp xử lý lô không đạt.",
                "Đề xuất cải tiến quy trình để giảm hao hụt và bảo đảm an toàn thực phẩm."
            ],
            ["Dây chuyền sơ chế rau củ hữu cơ", "Quy trình kiểm soát chất lượng nước ép"],
            [
                "Vận hành dây chuyền sơ chế rau củ, kiểm soát nhiệt độ và vệ sinh theo tiêu chuẩn HACCP.",
                "Theo dõi chất lượng nước ép đóng chai, phối hợp xử lý lô lệch chỉ tiêu và cập nhật hồ sơ."
            ],
            ["Chứng chỉ HACCP", "Chứng chỉ An toàn Thực phẩm"],
            [
                "Vận hành dây chuyền sản xuất theo quy trình đã phê duyệt.",
                "Kiểm tra nguyên liệu, nhiệt độ và vệ sinh thiết bị.",
                "Ghi chép hồ sơ sản xuất và lấy mẫu kiểm nghiệm.",
                "Phối hợp QC xử lý lô hàng không đạt tiêu chuẩn.",
                "Tuân thủ quy định an toàn thực phẩm và 5S.",
                "Đề xuất cải tiến giảm hao hụt và tăng năng suất."
            ],
            [
                "Có kinh nghiệm sản xuất hoặc kiểm soát chất lượng thực phẩm.",
                "Hiểu HACCP, ISO 22000 và quy định an toàn thực phẩm.",
                "Cẩn thận với hồ sơ và số liệu kiểm nghiệm.",
                "Sẵn sàng làm việc theo ca tại nhà máy.",
                "Ưu tiên ứng viên tốt nghiệp ngành thực phẩm hoặc công nghệ sinh học."
            ],
            [
                ("HACCP", MucDoYC.BatBuc), ("Food Safety", MucDoYC.BatBuc), ("ISO 9001", MucDoYC.UuTien),
                ("Excel", MucDoYC.UuTien), ("Attention to Detail", MucDoYC.UuTien), ("Problem Solving", MucDoYC.KhongBatBuoc),
                ("Teamwork", MucDoYC.KhongBatBuoc), ("Time Management", MucDoYC.KhongBatBuoc)
            ]),

        new("education", "Giáo viên Tiếng Anh", "Giáo dục / Đào tạo", "academic-cv", "education",
            "Giáo viên tiếng Anh giảng dạy theo khung năng lực Cambridge, quản lý lớp học và theo dõi tiến bộ học viên.",
            "Trung tâm vận hành 12 cơ sở, giáo viên phối hợp với trợ giảng và chuyên viên tư vấn để bảo đảm tiến độ học viên.",
            "Sư phạm Tiếng Anh",
            ["Tri Thức Việt", "ILA Vietnam", "Apollo English"],
            ["Thực tập sinh Giảng dạy", "Giáo viên Tiếng Anh", "Giáo viên Tiếng Anh cao cấp"],
            [
                "Giảng dạy tiếng Anh cho học sinh phổ thông theo giáo trình Cambridge, lớp 12 đến 16 học viên.",
                "Soạn giáo án, chuẩn bị tài liệu và tổ chức hoạt động tương tác trong lớp.",
                "Theo dõi tiến bộ học viên, nhận xét định kỳ và trao đổi với phụ huynh.",
                "Tham gia đào tạo chuyên môn và cải tiến phương pháp giảng dạy."
            ],
            ["Chương trình tiếng Anh thiếu niên", "Lớp luyện thi chứng chỉ Cambridge"],
            [
                "Giảng dạy chương trình tiếng Anh thiếu niên, xây dựng hoạt động nhóm giúp học viên tự tin giao tiếp.",
                "Phụ trách lớp luyện thi Cambridge, theo dõi kết quả và điều chỉnh giáo án theo trình độ học viên."
            ],
            ["TESOL Certificate", "Chứng chỉ Nghiệp vụ Sư phạm"],
            [
                "Giảng dạy theo giáo trình và chuẩn đầu ra của trung tâm.",
                "Soạn giáo án, tài liệu và hoạt động lớp học.",
                "Quản lý lớp học, theo dõi tiến bộ và nhận xét học viên.",
                "Trao đổi định kỳ với phụ huynh về kết quả học tập.",
                "Tham gia đào tạo và sinh hoạt chuyên môn.",
                "Phối hợp trợ giảng và tư vấn để giữ chân học viên."
            ],
            [
                "Tốt nghiệp ngành Sư phạm Tiếng Anh hoặc tương đương.",
                "Có chứng chỉ TESOL hoặc nghiệp vụ sư phạm.",
                "Phát âm tốt, giao tiếp tiếng Anh thành thạo.",
                "Yêu học sinh, kiên nhẫn và có trách nhiệm.",
                "Ưu tiên ứng viên có kinh nghiệm dạy Cambridge hoặc IELTS."
            ],
            [
                ("Teaching", MucDoYC.BatBuc), ("Lesson Planning", MucDoYC.BatBuc), ("English", MucDoYC.BatBuc),
                ("Communication", MucDoYC.UuTien), ("Academic Advising", MucDoYC.KhongBatBuoc), ("Teamwork", MucDoYC.UuTien),
                ("Time Management", MucDoYC.KhongBatBuoc), ("Problem Solving", MucDoYC.KhongBatBuoc)
            ]),

        new("hospitality", "Nhân viên Khách sạn / Điều hành Tour", "Du lịch / Khách sạn", "clean-corporate", "service",
            "Nhân sự khách sạn và lữ hành phục vụ khách nội địa, quốc tế và bảo đảm trải nghiệm dịch vụ nhất quán.",
            "Khách sạn 120 phòng và trung tâm lữ hành phối hợp theo ca, làm việc với đối tác vận chuyển và nhà hàng để giữ chất lượng dịch vụ.",
            "Quản trị Khách sạn",
            ["Biển Ngọc", "Mường Thanh", "Saigontourist"],
            ["Thực tập sinh Khách sạn", "Nhân viên Khách sạn", "Giám sát Buồng phòng"],
            [
                "Đón tiếp khách, làm thủ tục nhận và trả phòng, xử lý yêu cầu trong thời gian lưu trú.",
                "Điều phối tour, sắp xếp lịch trình và theo dõi đoàn khách trong suốt hành trình.",
                "Phối hợp với buồng phòng, nhà hàng và đối tác vận chuyển để giữ cam kết dịch vụ.",
                "Xử lý phản hồi của khách, ghi nhận sự cố và báo cáo cấp quản lý."
            ],
            ["Vận hành lễ tân khách sạn 120 phòng", "Điều hành tour đoàn quốc tế"],
            [
                "Tham gia vận hành lễ tân, chuẩn hoá quy trình nhận phòng và xử lý phản hồi của khách.",
                "Điều hành tour đoàn quốc tế, phối hợp hướng dẫn viên và đối tác để giữ lịch trình."
            ],
            ["Chứng chỉ Nghiệp vụ Khách sạn", "Chứng chỉ Tiếng Anh Giao tiếp"],
            [
                "Đón tiếp và hỗ trợ khách trong thời gian lưu trú.",
                "Thực hiện thủ tục nhận, trả phòng và thanh toán.",
                "Điều phối tour, lịch trình và dịch vụ liên quan.",
                "Phối hợp các bộ phận để bảo đảm chất lượng dịch vụ.",
                "Xử lý phản hồi và sự cố của khách.",
                "Tuân thủ tiêu chuẩn phục vụ và quy trình an toàn."
            ],
            [
                "Có kinh nghiệm lễ tân, buồng phòng hoặc điều hành tour.",
                "Giao tiếp tốt, thân thiện và xử lý tình huống linh hoạt.",
                "Giao tiếp tiếng Anh ở mức khá, ưu tiên thêm ngoại ngữ khác.",
                "Sẵn sàng làm việc theo ca và ngày cao điểm.",
                "Tác phong chuyên nghiệp, chú trọng trải nghiệm khách."
            ],
            [
                ("Hotel Operations", MucDoYC.BatBuc), ("Tour Operations", MucDoYC.UuTien), ("English", MucDoYC.UuTien),
                ("Customer Service", MucDoYC.BatBuc), ("Communication", MucDoYC.UuTien), ("Teamwork", MucDoYC.KhongBatBuoc),
                ("Time Management", MucDoYC.KhongBatBuoc), ("Problem Solving", MucDoYC.UuTien)
            ]),

        new("customer-service", "Chuyên viên Chăm sóc khách hàng", "Dịch vụ khách hàng", "clean-corporate", "service",
            "Chuyên viên chăm sóc khách hàng tiếp nhận yêu cầu, tư vấn và xử lý khiếu nại qua nhiều kênh.",
            "Trung tâm dịch vụ khách hàng vận hành theo ca, phối hợp với kinh doanh và vận hành để giải quyết yêu cầu đúng hạn.",
            "Quản trị kinh doanh",
            ["An Phát Distribution", "Viettel Post", "Shopee Việt Nam"],
            ["Thực tập sinh Chăm sóc khách hàng", "Chuyên viên Chăm sóc khách hàng", "Trưởng nhóm Chăm sóc khách hàng"],
            [
                "Tiếp nhận và xử lý yêu cầu của khách qua điện thoại, email và kênh trực tuyến.",
                "Tư vấn sản phẩm, hướng dẫn sử dụng và giải đáp thắc mắc của khách hàng.",
                "Ghi nhận khiếu nại, phối hợp bộ phận liên quan và theo dõi đến khi giải quyết xong.",
                "Cập nhật dữ liệu khách hàng lên hệ thống và báo cáo các vấn đề lặp lại."
            ],
            ["Trung tâm hỗ trợ khách hàng đa kênh", "Chương trình chăm sóc khách hàng thân thiết"],
            [
                "Xử lý yêu cầu khách hàng qua ba kênh, giữ thời gian phản hồi đầu tiên dưới 10 phút.",
                "Phối hợp xây dựng kịch bản trả lời chuẩn và quy trình xử lý khiếu nại cho nhóm hỗ trợ."
            ],
            ["Chứng chỉ Kỹ năng Chăm sóc Khách hàng", "Chứng chỉ Giao tiếp Chuyên nghiệp"],
            [
                "Tiếp nhận và phản hồi yêu cầu khách hàng qua nhiều kênh.",
                "Tư vấn sản phẩm và hướng dẫn sử dụng dịch vụ.",
                "Ghi nhận khiếu nại và phối hợp xử lý đến khi đóng.",
                "Cập nhật dữ liệu và báo cáo vấn đề lặp lại.",
                "Tuân thủ kịch bản và tiêu chuẩn dịch vụ.",
                "Đề xuất cải tiến quy trình để giảm khiếu nại."
            ],
            [
                "Có kinh nghiệm chăm sóc khách hàng hoặc tổng đài.",
                "Giao tiếp tốt, kiên nhẫn và biết lắng nghe.",
                "Xử lý được nhiều cuộc trò chuyện song song.",
                "Thành thạo máy tính và hệ thống quản lý yêu cầu.",
                "Sẵn sàng làm việc theo ca."
            ],
            [
                ("Customer Service", MucDoYC.BatBuc), ("Communication", MucDoYC.BatBuc), ("Problem Solving", MucDoYC.UuTien),
                ("CRM", MucDoYC.UuTien), ("Sales", MucDoYC.KhongBatBuoc), ("English", MucDoYC.KhongBatBuoc),
                ("Time Management", MucDoYC.UuTien), ("Teamwork", MucDoYC.KhongBatBuoc),
                ("Critical Thinking", MucDoYC.KhongBatBuoc)
            ]),

        new("finance", "Chuyên viên Tài chính / Tín dụng", "Tài chính / Kế toán", "professional-split", "finance",
            "Chuyên viên tài chính thẩm định hồ sơ, phân tích rủi ro và theo dõi chất lượng danh mục.",
            "Khối tín dụng và rủi ro làm việc theo quy trình phê duyệt nhiều bước, phối hợp với kinh doanh và pháp chế để ra quyết định.",
            "Tài chính – Ngân hàng",
            ["Thịnh Vượng Finance", "Techcombank", "VPBank"],
            ["Thực tập sinh Tín dụng", "Chuyên viên Thẩm định Tín dụng", "Chuyên viên Phân tích Rủi ro"],
            [
                "Thẩm định hồ sơ vay, phân tích thu nhập, tài sản bảo đảm và lịch sử tín dụng.",
                "Xếp hạng tín dụng khách hàng, đề xuất hạn mức và điều kiện vay phù hợp.",
                "Theo dõi danh mục, phát hiện khoản vay có dấu hiệu rủi ro và đề xuất biện pháp xử lý.",
                "Phối hợp kinh doanh và pháp chế để hoàn thiện hồ sơ và tuân thủ quy định."
            ],
            ["Quy trình thẩm định tín dụng doanh nghiệp nhỏ", "Dashboard theo dõi chất lượng danh mục"],
            [
                "Thẩm định hồ sơ vay doanh nghiệp nhỏ, chuẩn hoá bảng tính và rút ngắn thời gian phê duyệt.",
                "Xây dựng dashboard theo dõi nợ quá hạn và chất lượng danh mục theo khu vực."
            ],
            ["Chứng chỉ Tín dụng Ngân hàng", "Chứng chỉ Phân tích Tài chính (CFA Level 1)"],
            [
                "Thẩm định hồ sơ vay và phân tích khả năng trả nợ.",
                "Xếp hạng tín dụng và đề xuất điều kiện cấp tín dụng.",
                "Theo dõi danh mục và cảnh báo khoản vay rủi ro.",
                "Lập báo cáo phân tích tài chính định kỳ.",
                "Phối hợp các bộ phận để hoàn thiện hồ sơ.",
                "Tuân thủ quy định nội bộ và pháp luật về tín dụng."
            ],
            [
                "Có kinh nghiệm thẩm định tín dụng hoặc phân tích tài chính.",
                "Đọc hiểu báo cáo tài chính và phân tích dòng tiền.",
                "Thành thạo Excel, tư duy số liệu tốt.",
                "Cẩn thận, trung thực và chịu được áp lực thời hạn.",
                "Ưu tiên ứng viên có chứng chỉ tín dụng hoặc CFA."
            ],
            [
                ("Credit Analysis", MucDoYC.BatBuc), ("Risk Management", MucDoYC.BatBuc), ("Excel", MucDoYC.BatBuc),
                ("Statistics", MucDoYC.UuTien), ("Accounting", MucDoYC.UuTien), ("Analytical Problem-Solving", MucDoYC.UuTien),
                ("Communication", MucDoYC.KhongBatBuoc), ("Attention to Detail", MucDoYC.UuTien),
                ("Debt Collection", MucDoYC.KhongBatBuoc)
            ])
    ];

    public static DemoFamily Get(string key) =>
        All.FirstOrDefault(x => x.Key == key)
        ?? throw new InvalidOperationException($"Không có nhóm nghề demo '{key}'.");
}
