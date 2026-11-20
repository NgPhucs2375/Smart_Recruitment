# USER REQUIREMENTS DOCUMENT  
# SMART RECRUITMENT

## 1. Thông tin tài liệu

**Tên hệ thống:** Smart Recruitment  
**Tên đề tài:** Hệ thống kết nối ứng viên với nhà tuyển dụng thông minh  
**Loại tài liệu:** User Requirements Document - URD  
**Đối tượng sử dụng:** Quản trị viên, Người đại diện doanh nghiệp, Nhân sự tuyển dụng, Ứng viên  
**Nền tảng:** Web Application  
**Định hướng mở rộng:** Mobile Application, AI Agent, Recommendation System, RAG/Chunkless RAG, Graph-based Retrieval.

---

# 2. Giới thiệu

## 2.1. Bối cảnh

Trong các nền tảng tuyển dụng truyền thống, ứng viên thường phải tự tìm kiếm công việc thông qua từ khóa, ngành nghề hoặc địa điểm. Nhà tuyển dụng ngược lại phải tiếp nhận và đọc số lượng lớn CV để tìm ra những ứng viên phù hợp.

Cách tiếp cận này tồn tại một số vấn đề:

- Ứng viên khó đánh giá công việc nào thực sự phù hợp với năng lực của mình.
- Nhà tuyển dụng mất nhiều thời gian sàng lọc CV.
- Việc tìm kiếm dựa trên từ khóa không phản ánh đầy đủ ý nghĩa của kỹ năng và kinh nghiệm.
- Ứng viên có thể sử dụng nhiều cách diễn đạt khác nhau cho cùng một kỹ năng.
- CV chứa nhiều thông tin phi cấu trúc nên khó khai thác bằng truy vấn cơ sở dữ liệu truyền thống.
- Nhà tuyển dụng và ứng viên thiếu một công cụ hỗ trợ phân tích mức độ phù hợp.
- Các nền tảng tuyển dụng thường tập trung vào việc đăng và tìm tin hơn là hỗ trợ ra quyết định.

Smart Recruitment được xây dựng nhằm giải quyết các vấn đề trên bằng việc kết hợp hệ thống quản lý tuyển dụng với AI Agent, phân tích CV và cơ chế gợi ý thông minh.

---

# 3. Mục tiêu hệ thống

Smart Recruitment hướng đến việc xây dựng một nền tảng kết nối hai phía:

**Ứng viên ↔ Nhà tuyển dụng**

trong đó hệ thống đóng vai trò trung gian thông minh thay vì chỉ là nơi đăng tin tuyển dụng.

Các mục tiêu chính gồm:

1. Cho phép doanh nghiệp quản lý hoạt động tuyển dụng.

2. Cho phép người đại diện quản lý doanh nghiệp và đội ngũ nhân sự.

3. Cho phép nhân sự quản lý các tin tuyển dụng mà họ chịu trách nhiệm.

4. Cho phép ứng viên xây dựng và quản lý hồ sơ nghề nghiệp.

5. Cho phép ứng viên tạo và quản lý nhiều CV.

6. Cho phép ứng viên ứng tuyển vào các tin tuyển dụng.

7. Theo dõi xuyên suốt trạng thái của đơn ứng tuyển.

8. Phân tích nội dung CV bằng AI.

9. Phân tích mức độ phù hợp giữa ứng viên và tin tuyển dụng.

10. Gợi ý công việc phù hợp cho ứng viên.

11. Gợi ý ứng viên tiềm năng cho nhà tuyển dụng.

12. Cung cấp AI Copilot hỗ trợ người dùng trong quá trình sử dụng hệ thống.

13. Hỗ trợ tìm kiếm dựa trên ngữ nghĩa thay vì chỉ dựa trên từ khóa.

14. Từng bước xây dựng Knowledge Retrieval System sử dụng RAG, Chunkless RAG hoặc Graph-based Retrieval.

---

# 4. Định nghĩa các vai trò

Hệ thống có bốn nhóm người dùng chính.

## 4.1. Quản trị viên - Administrator

Quản trị viên có quyền quản lý toàn bộ hệ thống.

Administrator không thuộc phạm vi quản lý của bất kỳ doanh nghiệp nào và có quyền cao nhất trong hệ thống.

Quản trị viên có thể:

- Quản lý tài khoản người dùng.
- Xem danh sách người dùng.
- Khóa hoặc mở khóa tài khoản.
- Quản lý doanh nghiệp.
- Kiểm duyệt doanh nghiệp.
- Quản lý danh mục nghề nghiệp.
- Quản lý danh mục kỹ năng.
- Quản lý tin tuyển dụng.
- Xử lý tin tuyển dụng vi phạm.
- Theo dõi hoạt động hệ thống.
- Quản lý cấu hình AI.
- Quản lý thông báo.
- Xem báo cáo và thống kê toàn hệ thống.
- Kiểm tra log hệ thống.
- Quản lý dữ liệu dùng chung.

Administrator có thể truy cập dữ liệu của tất cả doanh nghiệp trong hệ thống theo chức năng quản trị.

---

# 5. Người đại diện doanh nghiệp

## 5.1. Khái niệm

Người đại diện là tài khoản sở hữu hoặc đại diện chính thức của một doanh nghiệp trên hệ thống.

Mỗi doanh nghiệp có một người đại diện chính.

Người đại diện có toàn quyền quản lý dữ liệu và hoạt động tuyển dụng thuộc doanh nghiệp mà mình đại diện.

Người đại diện không có quyền quản lý doanh nghiệp khác.

---

## 5.2. Quyền của Người đại diện

Người đại diện được phép:

- Tạo và cập nhật hồ sơ doanh nghiệp.
- Quản lý thông tin doanh nghiệp.
- Quản lý logo doanh nghiệp.
- Quản lý địa chỉ.
- Quản lý website.
- Quản lý lĩnh vực hoạt động.
- Quản lý quy mô nhân sự.
- Quản lý thông tin tuyển dụng của doanh nghiệp.
- Đăng tin tuyển dụng.
- Chỉnh sửa tin tuyển dụng của doanh nghiệp.
- Đóng hoặc mở tin tuyển dụng.
- Xem toàn bộ tin tuyển dụng thuộc doanh nghiệp.
- Xem toàn bộ đơn ứng tuyển gửi vào doanh nghiệp.
- Xem ứng viên phù hợp với các vị trí đang tuyển.
- Sử dụng AI Candidate Search.
- Mời tài khoản khác trở thành Nhân sự của doanh nghiệp.
- Quản lý danh sách nhân sự tuyển dụng.
- Xóa hoặc vô hiệu hóa nhân sự khỏi doanh nghiệp.
- Xem báo cáo tuyển dụng của doanh nghiệp.

---

# 6. Cơ chế mời Nhân sự

Người đại diện có thể mời một người trở thành Nhân sự của doanh nghiệp.

Luồng nghiệp vụ:

**Người đại diện**

→ nhập Email

→ nhập Họ tên

→ nhập Chức vụ

→ gửi lời mời

→ hệ thống tạo Invitation Token

→ gửi lời mời

→ người được mời mở liên kết

→ đăng ký hoặc đăng nhập

→ xác nhận lời mời

→ trở thành Nhân sự của doanh nghiệp.

Lời mời phải có:

- Email người nhận.
- Doanh nghiệp.
- Người gửi lời mời.
- Token xác thực.
- Ngày tạo.
- Ngày hết hạn.
- Trạng thái.

Các trạng thái có thể gồm:

- Chờ xác nhận.
- Đã chấp nhận.
- Đã từ chối.
- Hết hạn.
- Đã thu hồi.

Một invitation token hết hạn không được phép sử dụng.

---

# 7. Nhân sự - Recruiter / HR

## 7.1. Khái niệm

Nhân sự là người được Người đại diện mời tham gia doanh nghiệp.

Nhân sự không có toàn quyền với doanh nghiệp.

Nhân sự chịu trách nhiệm chủ yếu đối với:

- Tin tuyển dụng mà mình đăng.
- Các đơn ứng tuyển thuộc tin tuyển dụng do mình phụ trách.
- Các ứng viên thuộc quy trình tuyển dụng của mình.

---

# 8. Quyền của Nhân sự

Nhân sự được phép:

- Xem thông tin doanh nghiệp mình đang làm việc.
- Tạo tin tuyển dụng.
- Chỉnh sửa tin tuyển dụng do mình tạo.
- Đóng tin tuyển dụng do mình tạo.
- Xem danh sách tin tuyển dụng của mình.
- Xem đơn ứng tuyển thuộc các tin của mình.
- Xử lý đơn ứng tuyển.
- Đánh giá ứng viên.
- Xem CV ứng viên đã gửi.
- Xem kết quả AI Matching.
- Tìm kiếm ứng viên phù hợp với tin tuyển dụng.
- Sử dụng AI Recruiter Copilot.
- Theo dõi trạng thái tuyển dụng.
- Gửi thông báo liên quan đến quy trình tuyển dụng.

Nhân sự không được:

- Sửa thông tin sở hữu doanh nghiệp.
- Quản lý Người đại diện.
- Mời thêm Nhân sự nếu chưa được cấp quyền tương ứng.
- Chỉnh sửa hoặc xử lý tin tuyển dụng thuộc Nhân sự khác nếu không được phân quyền.
- Xử lý đơn ứng tuyển thuộc tin tuyển dụng của Nhân sự khác nếu không có quyền.
- Truy cập dữ liệu của doanh nghiệp khác.

---

# 9. Ứng viên - Candidate

## 9.1. Khái niệm

Ứng viên là người sử dụng hệ thống với mục tiêu tìm kiếm việc làm, tạo CV và ứng tuyển vào các vị trí phù hợp.

Mỗi ứng viên sở hữu hồ sơ cá nhân của riêng mình.

---

# 10. Hồ sơ ứng viên

Ứng viên có thể quản lý các thông tin:

- Họ tên.
- Số điện thoại.
- Ngày sinh.
- Giới tính.
- Địa chỉ.
- Giới thiệu bản thân.
- Vị trí mong muốn.
- Mức lương mong muốn.
- Trạng thái tìm việc.
- Kinh nghiệm làm việc.
- Danh sách kỹ năng.
- Mức độ thành thạo kỹ năng.
- Số năm kinh nghiệm với kỹ năng.
- CV.
- Lịch sử ứng tuyển.

Ứng viên chỉ có quyền chỉnh sửa hồ sơ thuộc tài khoản của mình.

---

# 11. Quản lý kỹ năng ứng viên

Ứng viên có thể thêm các kỹ năng vào hồ sơ.

Ví dụ:

- C#
- ASP.NET Core
- React
- SQL Server
- Docker
- AWS
- Git
- Java
- Python.

Mỗi kỹ năng có thể bao gồm:

- Tên kỹ năng.
- Mức độ thành thạo.
- Số năm kinh nghiệm.

Mức độ có thể được chuẩn hóa thành:

- Cơ bản.
- Trung bình.
- Thành thạo.
- Chuyên gia.

Thông tin này được sử dụng trong thuật toán matching.

---

# 12. Kinh nghiệm làm việc

Ứng viên có thể khai báo nhiều kinh nghiệm làm việc.

Mỗi kinh nghiệm gồm:

- Tên công ty.
- Địa chỉ.
- Thời gian bắt đầu.
- Thời gian kết thúc.
- Mô tả công việc.
- Trạng thái đang làm việc hiện tại.

AI có thể sử dụng dữ liệu kinh nghiệm kết hợp với nội dung CV để đánh giá độ phù hợp với tin tuyển dụng.

---

# 13. Quản lý CV

Một ứng viên có thể có nhiều CV.

Ứng viên có thể:

- Tạo CV.
- Xem CV.
- Chỉnh sửa CV.
- Xóa CV.
- Chọn CV mặc định.
- Tải CV.
- Sử dụng CV khi ứng tuyển.
- Yêu cầu AI phân tích CV.

Hệ thống hỗ trợ **ba phương thức tạo CV**.

---

# 14. Phương thức 1 - Tạo CV thủ công

Ứng viên lựa chọn template CV.

Sau đó nhập các thông tin:

- Thông tin cá nhân.
- Giới thiệu bản thân.
- Mục tiêu nghề nghiệp.
- Học vấn.
- Kinh nghiệm.
- Kỹ năng.
- Dự án.
- Chứng chỉ.
- Thành tích.
- Ngoại ngữ.

Hệ thống tạo CV dựa trên template.

Ứng viên có thể xem trước trước khi lưu hoặc xuất file.

---

# 15. Phương thức 2 - Import CV có sẵn

Ứng viên có thể upload CV hiện tại của mình.

Định dạng dự kiến:

- PDF.
- DOCX.

Luồng:

**Upload CV**

→ kiểm tra định dạng

→ lưu file

→ trích xuất nội dung

→ AI phân tích nội dung

→ nhận diện thông tin

→ chuyển thành dữ liệu có cấu trúc

→ ứng viên xác nhận

→ lưu vào hồ sơ.

Hệ thống có thể nhận diện:

- Họ tên.
- Contact information.
- Skills.
- Work Experience.
- Education.
- Projects.
- Certifications.
- Languages.
- Career summary.

AI không tự động thay đổi dữ liệu hồ sơ của ứng viên nếu chưa có quy trình xác nhận thích hợp.

---

# 16. Phương thức 3 - AI Agent hỗ trợ tạo CV

Ứng viên có thể tạo CV thông qua hội thoại với AI Agent.

Ví dụ:

**AI:**

“Bạn đang muốn ứng tuyển vào vị trí nào?”

**Ứng viên:**

“Backend .NET Developer.”

AI tiếp tục thu thập:

- Thông tin cá nhân.
- Mục tiêu nghề nghiệp.
- Kỹ năng.
- Kinh nghiệm.
- Dự án.
- Công nghệ.
- Học vấn.
- Thành tựu.

Agent có thể phát hiện thiếu thông tin và yêu cầu bổ sung.

Ví dụ:

“Bạn có nói rằng đã làm ASP.NET Core. Bạn đã sử dụng nó trong dự án nào?”

Sau khi đủ dữ liệu:

AI

→ chuẩn hóa thông tin

→ xây dựng nội dung

→ đề xuất cách trình bày

→ tạo cấu trúc CV

→ chọn template

→ Preview

→ Candidate Confirm

→ Generate CV.

Ứng viên luôn có quyền chỉnh sửa kết quả trước khi lưu.

---

# 17. Quản lý doanh nghiệp

Doanh nghiệp có các thông tin:

- Tên doanh nghiệp.
- Mô tả.
- Website.
- Địa chỉ.
- Logo.
- Mã số thuế.
- Lĩnh vực hoạt động.
- Quy mô nhân sự.
- Người đại diện.
- Danh sách nhân sự.
- Danh sách tin tuyển dụng.

Người đại diện có quyền quản lý doanh nghiệp.

Nhân sự chủ yếu có quyền đọc thông tin doanh nghiệp.

---

# 18. Quản lý tin tuyển dụng

Người đại diện và Nhân sự có quyền phù hợp được phép tạo tin tuyển dụng.

Tin tuyển dụng bao gồm:

- Tiêu đề.
- Ngành nghề.
- Mô tả công việc.
- Yêu cầu kinh nghiệm.
- Yêu cầu công việc.
- Quyền lợi.
- Địa điểm.
- Lương tối thiểu.
- Lương tối đa.
- Ngày hết hạn.
- Trạng thái.
- Người đăng.
- Doanh nghiệp.
- Danh sách kỹ năng yêu cầu.

---

# 19. Kỹ năng yêu cầu của tin tuyển dụng

Một tin tuyển dụng có thể yêu cầu nhiều kỹ năng.

Mỗi kỹ năng có mức độ yêu cầu.

### Không bắt buộc

Có kỹ năng là một lợi thế nhưng không ảnh hưởng nghiêm trọng đến kết quả.

### Ưu tiên

Ứng viên có kỹ năng sẽ được đánh giá cao hơn.

### Bắt buộc

Ứng viên thiếu kỹ năng này sẽ bị giảm đáng kể mức độ phù hợp.

Ví dụ:

**Backend .NET Developer**

| Skill | Requirement |
|---|---|
| C# | Bắt buộc |
| ASP.NET Core | Bắt buộc |
| SQL Server | Bắt buộc |
| Docker | Ưu tiên |
| AWS | Không bắt buộc |

---

# 20. Tìm kiếm việc làm

Ứng viên có thể xem danh sách tin tuyển dụng.

Hỗ trợ tìm kiếm theo:

- Từ khóa.
- Vị trí.
- Ngành nghề.
- Công ty.
- Mức lương.
- Địa điểm.
- Kỹ năng.
- Mức độ phù hợp.

Ngoài tìm kiếm truyền thống, hệ thống cung cấp:

**Recommended Jobs - Việc làm dành cho bạn.**

---

# 21. Ứng tuyển

Khi xem một tin tuyển dụng, ứng viên có thể chọn:

**Ứng tuyển**

Ứng viên chọn một CV thuộc tài khoản của mình.

Luồng:

Candidate

→ View Job

→ Apply

→ Select CV

→ Confirm

→ Create Application

→ Recruiter receives notification.

Một ứng viên không được sử dụng CV của tài khoản khác để ứng tuyển.

---

# 22. Quy trình xử lý đơn ứng tuyển

Đơn ứng tuyển kết nối:

- Tin tuyển dụng.
- CV ứng viên.
- Người xử lý.
- Trạng thái.
- Ghi chú.
- Đánh giá.

Luồng trạng thái dự kiến:

**Đã ứng tuyển**

→ **Đã tiếp nhận**

→ **Đang xem xét**

→ **Mời phỏng vấn**

→ **Đề nghị tuyển dụng**

→ **Đã tuyển**

hoặc:

→ **Từ chối**

Tất cả thay đổi quan trọng về trạng thái cần có khả năng gửi thông báo cho ứng viên.

---

# 23. Matching Engine

Matching Engine là thành phần trung tâm của Smart Recruitment.

Hệ thống cần đánh giá:

**Candidate ↔ Job**

theo nhiều tiêu chí.

Phiên bản đầu tiên có thể sử dụng:

- Skill Matching.
- Experience Matching.
- Position Matching.
- Salary Matching.
- Location Matching.

Ví dụ:

**Ứng viên**

- C#
- ASP.NET Core
- SQL Server.
- Docker.

**Job**

- C# - Bắt buộc.
- ASP.NET Core - Bắt buộc.
- SQL Server - Ưu tiên.
- Docker - Ưu tiên.
- AWS - Không bắt buộc.

Kết quả:

**Match Score: 87%**

Kỹ năng phù hợp:

- C#.
- ASP.NET Core.
- SQL Server.
- Docker.

Kỹ năng thiếu:

- AWS.

---

# 24. Kết quả phù hợp

Hệ thống lưu kết quả matching giữa ứng viên và tin tuyển dụng.

Thông tin gồm:

- Candidate.
- Job.
- Match Score.
- Matched Skills.
- Missing Skills.
- Classification.
- Explanation.

Phân loại:

- Cao.
- Trung bình.
- Thấp.

Kết quả này được sử dụng cho cả hai phía.

---

# 25. Gợi ý công việc cho ứng viên

Hệ thống phân tích:

- Hồ sơ.
- CV.
- Skills.
- Experience.
- Desired Position.
- Expected Salary.
- Location.
- Semantic similarity.

Sau đó trả về:

**Recommended Jobs**

Ví dụ:

### Backend .NET Developer  
ABC Technology

**91% phù hợp**

Phù hợp:

- C#.
- ASP.NET Core.
- SQL Server.
- REST API.

Thiếu:

- Docker.
- AWS.

Ứng viên có thể yêu cầu AI giải thích:

“Tại sao công việc này phù hợp với tôi?”

---

# 26. Gợi ý ứng viên cho doanh nghiệp

Ở phía Recruiter:

Tin tuyển dụng

→ Matching Engine

→ Candidate Search

→ Ranking

→ Recommended Candidates.

Ví dụ:

**Backend Developer**

1. Nguyễn Văn A - 94%.
2. Trần Văn B - 91%.
3. Lê Văn C - 87%.

Nhân sự có thể mở từng ứng viên để xem:

- Match Score.
- Skills.
- Experience.
- CV.
- Missing skills.
- Salary expectation.
- AI explanation.

---

# 27. AI Copilot

Hệ thống tích hợp một AI Agent thông qua CopilotKit.

Copilot không chỉ là chatbot hỏi đáp chung.

Copilot cần có khả năng hiểu:

- Người dùng hiện tại.
- Role hiện tại.
- Trang hiện tại.
- Candidate.
- Company.
- Job.
- CV.
- Application.

Agent chỉ được phép thực hiện các hành động thuộc quyền của người dùng hiện tại.

---

# 28. Candidate Copilot

AI Agent dành cho ứng viên có thể hỗ trợ:

### Hỏi đáp hệ thống

Ví dụ:

“Làm sao tạo CV?”

“Tôi có thể thay CV sau khi ứng tuyển không?”

### Hỗ trợ CV

- Phân tích CV.
- Tóm tắt CV.
- Phát hiện thiếu thông tin.
- Đề xuất cải thiện nội dung.
- Viết lại mô tả kinh nghiệm.
- Đề xuất kỹ năng.
- Hỗ trợ tạo CV thông qua hội thoại.

### Tìm việc

Candidate:

“Tìm công việc Backend phù hợp với tôi.”

Agent:

→ đọc profile

→ đọc CV

→ retrieve jobs

→ matching

→ ranking

→ trả kết quả.

### Phân tích Job

Candidate:

“Tôi có phù hợp với công việc này không?”

Agent:

→ Candidate Profile

→ CV

→ Job

→ Matching Result

→ Explanation.

---

# 29. Recruiter Copilot

AI Agent cho Recruiter hỗ trợ:

- Tìm ứng viên.
- Phân tích CV.
- Ranking ứng viên.
- So sánh ứng viên.
- Giải thích Match Score.
- Tìm ứng viên theo yêu cầu tự nhiên.

Ví dụ:

“Tìm ứng viên Backend .NET có ít nhất 2 năm kinh nghiệm và biết Docker.”

AI chuyển yêu cầu thành:

- Position = Backend.
- Stack = .NET.
- Experience >= 2 years.
- Skill = Docker.

Sau đó thực hiện Candidate Retrieval.

---

# 30. AI Support Assistant

Copilot cũng đóng vai trò hỗ trợ sử dụng hệ thống.

Ví dụ:

“Tôi muốn đăng tin tuyển dụng.”

“Tôi muốn mời thêm HR.”

“Làm sao thay đổi CV mặc định?”

Agent cần trả lời dựa trên tài liệu và quy tắc thực tế của Smart Recruitment.

Agent không được tạo ra quy định không tồn tại trong hệ thống.

---

# 31. Retrieval-Augmented Generation - RAG

Để AI có thể trả lời dựa trên dữ liệu của hệ thống, Smart Recruitment cần một Retrieval Layer.

Nguồn dữ liệu có thể bao gồm:

- CV.
- Job descriptions.
- Candidate Profiles.
- Candidate Skills.
- Experience.
- Company information.
- System documentation.
- Matching Results.

Luồng RAG cơ bản:

User Question

→ Query Understanding

→ Retrieval

→ Context

→ LLM

→ Answer.

---

# 32. Hạn chế của RAG sử dụng Chunking

RAG truyền thống thường chia tài liệu thành nhiều đoạn nhỏ.

Ví dụ CV:

CV

→ Chunk 1

→ Chunk 2

→ Chunk 3

→ Vector Embedding.

Nhược điểm tiềm năng:

Thông tin liên quan có thể nằm ở nhiều chunk khác nhau.

Ví dụ:

Một đoạn chứa:

“Backend Developer - ABC Company”

trong khi đoạn tiếp theo chứa:

“ASP.NET Core, SQL Server, Docker”.

Nếu retrieval chỉ tìm được một đoạn, AI có thể mất mối quan hệ giữa:

- Position.
- Company.
- Skill.
- Time period.

Điều này đặc biệt quan trọng với CV.

---

# 33. Chunkless Retrieval

Smart Recruitment cần nghiên cứu Chunkless RAG như một hướng thay thế hoặc bổ sung cho chunk-based retrieval.

Ý tưởng là hạn chế việc chia CV thành các đoạn nhỏ độc lập.

Thay vào đó, hệ thống có thể sử dụng:

- Full document representation.
- Structured CV representation.
- Hierarchical retrieval.
- Semantic document indexing.

Đối với CV, sau khi parsing:

Candidate

├── Basic Information  
├── Skills  
├── Experiences  
├── Education  
├── Projects  
└── Certificates.

Retrieval có thể làm việc trực tiếp với cấu trúc này.

Mục tiêu là bảo tồn quan hệ giữa các phần trong CV.

---

# 34. Định hướng Hybrid Retrieval

Smart Recruitment không nên phụ thuộc vào duy nhất một kỹ thuật retrieval.

Kiến trúc định hướng:

**Structured Retrieval**

+

**Semantic Vector Retrieval**

+

**Document Retrieval**

+

**Graph Retrieval**

→ **Hybrid Ranking**

→ **LLM Reasoning**

Ví dụ HR hỏi:

“Tìm Backend Developer biết .NET, SQL và có kinh nghiệm REST API.”

Structured Search có thể tìm:

- Candidate skills.
- Years of experience.

Vector Search phát hiện:

“Developed Web API using ASP.NET Core”

có ý nghĩa gần:

“REST API development”.

Graph Retrieval phát hiện:

ASP.NET Core

→ .NET

→ Backend Development.

Sau đó hệ thống kết hợp các kết quả.

---

# 35. Graph RAG - Định hướng nâng cao

Domain tuyển dụng có rất nhiều quan hệ tự nhiên.

Ví dụ:

Candidate

→ HAS_SKILL → C#

C#

→ PART_OF → .NET

ASP.NET Core

→ RELATED_TO → Web API

Docker

→ RELATED_TO → DevOps

Job

→ REQUIRES → ASP.NET Core.

Knowledge Graph có thể giúp hệ thống suy luận quan hệ thay vì chỉ tìm văn bản tương đồng.

GraphRAG được xem là hướng mở rộng sau khi Recommendation và Vector Retrieval hoạt động ổn định.

---

# 36. Kiến trúc AI định hướng

Smart Recruitment dự kiến chia AI thành các tầng:

**AI Agent Layer**

- Candidate Copilot.
- Recruiter Copilot.
- Support Copilot.
- CV Builder Agent.

↓

**AI Orchestration Layer**

- Intent detection.
- Tool calling.
- Permission validation.
- Context management.

↓

**Retrieval Layer**

- Structured Search.
- RAG.
- Chunkless Retrieval.
- Vector Search.
- Graph Search.

↓

**Knowledge Layer**

- CV.
- Candidate.
- Job.
- Skills.
- Company.
- Applications.
- System documents.

---

# 37. Nguyên tắc AI Permission

AI Agent không được phép bỏ qua authorization của hệ thống.

Ví dụ:

Candidate Agent không được:

- Xem CV ứng viên khác.
- Xem đơn ứng tuyển riêng của ứng viên khác.
- Sửa Job.
- Xem dữ liệu Recruiter nội bộ.

Recruiter Agent không được:

- Xử lý tin của HR khác nếu không có quyền.
- Truy cập doanh nghiệp khác.
- Thay đổi dữ liệu Candidate.

AI gọi API dưới identity của user hiện tại.

Mọi Agent Action phải đi qua:

**Authentication**

→ **Authorization**

→ **Business Rules**

→ **Execution**.

Không cho Agent truy cập database trực tiếp để thực hiện nghiệp vụ.

---

# 38. Hệ thống thông báo

Notification được sử dụng cho các sự kiện:

### Candidate

- Đơn ứng tuyển được tiếp nhận.
- Đơn chuyển trạng thái.
- Được mời phỏng vấn.
- Được nhận.
- Có công việc mới phù hợp.

### Recruiter

- Có ứng viên mới.
- Có ứng viên Match Score cao.
- Tin tuyển dụng sắp hết hạn.

### Representative

- HR chấp nhận lời mời.
- Có thay đổi quan trọng trong doanh nghiệp.

Hệ thống hỗ trợ trạng thái đã đọc/chưa đọc.

---

# 39. Yêu cầu tìm kiếm

Hệ thống có hai loại tìm kiếm.

## Traditional Search

- Keyword.
- Position.
- Company.
- Location.
- Salary.
- Category.
- Skill.

## Intelligent Search

Người dùng có thể nhập ngôn ngữ tự nhiên.

Ví dụ:

“Tìm công việc backend .NET cho sinh viên mới ra trường tại TP.HCM.”

hoặc:

“Tìm ứng viên biết C#, SQL, Docker và có khoảng hai năm kinh nghiệm.”

AI phân tích yêu cầu và chuyển thành retrieval phù hợp.

---

# 40. Yêu cầu bảo mật

Hệ thống phải đảm bảo:

- Authentication.
- Role Based Access Control.
- Resource Ownership Validation.
- Secure token.
- Password hashing.
- Invitation token expiration.
- Input validation.
- File validation.
- API authorization.
- Rate limiting cho AI API.
- Logging.
- Audit log đối với hành động quan trọng.

Tài nguyên phải được kiểm tra theo ownership chứ không chỉ role.

Ví dụ:

Recruiter có role `Recruiter` không đồng nghĩa với việc có thể:

`PUT /jobs/123`

Nếu Job 123 thuộc Recruiter khác.

---

# 41. Ma trận phân quyền tổng quát

| Chức năng | Admin | Người đại diện | Nhân sự | Ứng viên |
|---|---:|---:|---:|---:|
| Quản lý toàn hệ thống | ✓ | ✗ | ✗ | ✗ |
| Quản lý doanh nghiệp | ✓ | ✓ doanh nghiệp mình | Xem hạn chế | ✗ |
| Mời HR | ✓ | ✓ | ✗ | ✗ |
| Quản lý HR | ✓ | ✓ | ✗ | ✗ |
| Tạo Job | ✓ | ✓ | ✓ | ✗ |
| Quản lý tất cả Job doanh nghiệp | ✓ | ✓ | ✗ | ✗ |
| Quản lý Job mình đăng | ✓ | ✓ | ✓ | ✗ |
| Xem Application thuộc Job mình đăng | ✓ | ✓ | ✓ | ✗ |
| Quản lý Candidate Profile | ✓ quản trị | ✗ | ✗ | ✓ chính mình |
| Tạo CV | ✗ | ✗ | ✗ | ✓ |
| Import CV | ✗ | ✗ | ✗ | ✓ |
| AI Create CV | ✗ | ✗ | ✗ | ✓ |
| Apply Job | ✗ | ✗ | ✗ | ✓ |
| Recommended Jobs | ✗ | ✗ | ✗ | ✓ |
| Recommended Candidates | ✓ | ✓ | ✓ tin mình phụ trách | ✗ |
| AI Copilot | ✓ | ✓ | ✓ | ✓ |

---

# 42. Luồng tổng thể của Ứng viên

Register

→ Candidate Profile

→ Add Skills

→ Add Experience

→ Create / Import CV

→ AI Analyze CV

→ Profile Ready

→ Recommended Jobs

→ View Job

→ Analyze Match

→ Select CV

→ Apply

→ Track Application

→ Receive Notification.

---

# 43. Luồng tổng thể của Người đại diện

Register

→ Create/Claim Company

→ Complete Company Profile

→ Invite HR

→ Manage Recruiters

→ Create/View Jobs

→ View Recruitment Dashboard

→ AI Candidate Recommendations

→ Monitor Recruitment Results.

---

# 44. Luồng tổng thể của Nhân sự

Accept Invitation

→ Join Company

→ Create Job

→ Configure Requirements

→ Publish Job

→ Receive Applications

→ AI Candidate Ranking

→ Review CV

→ Update Application Status

→ Candidate Notification

→ Complete Recruitment.

---

# 45. Luồng AI Candidate Recommendation

Job

→ Normalize Job Data

→ Required Skills

→ Experience

→ Salary

→ Location

→ Semantic Representation

→ Candidate Retrieval

→ Hard Filters

→ Rule Matching

→ Semantic Matching

→ Ranking

→ Top Candidates

→ AI Explanation.

---

# 46. Luồng AI Job Recommendation

Candidate

→ Profile

→ CV

→ Skills

→ Experience

→ Desired Position

→ Salary

→ Semantic Representation

→ Job Retrieval

→ Eligibility Filter

→ Matching

→ Ranking

→ Recommended Jobs

→ AI Explanation.

---

# 47. Nguyên tắc Match Score

Match Score không nên chỉ do LLM tự đánh giá.

Điểm cần được tạo từ các tiêu chí có thể kiểm soát.

Ví dụ phiên bản đầu:

Skill Match: 40%

Experience: 20%

Position: 15%

Salary: 10%

Location: 5%

Semantic Similarity: 10%.

Tỷ trọng có thể thay đổi sau quá trình đánh giá thực nghiệm.

LLM chủ yếu chịu trách nhiệm giải thích kết quả chứ không nên là nguồn duy nhất quyết định điểm.

---

# 48. Giải thích kết quả matching

Hệ thống phải có khả năng trả lời:

- Vì sao phù hợp?
- Vì sao không phù hợp?
- Skill nào đã đáp ứng?
- Skill nào còn thiếu?
- Điều kiện nào chưa đạt?

Ví dụ:

**Match Score: 84%**

### Strengths

- ASP.NET Core phù hợp yêu cầu bắt buộc.
- Có SQL Server.
- Kinh nghiệm Backend phù hợp.
- Mức lương mong muốn nằm trong khoảng doanh nghiệp cung cấp.

### Missing

- Thiếu Docker.
- Chưa thể hiện kinh nghiệm AWS.

AI có thể chuyển kết quả kỹ thuật thành ngôn ngữ dễ hiểu.

---

# 49. Yêu cầu phi chức năng

## Performance

Các API CRUD thông thường cần phản hồi nhanh và ổn định.

Các tác vụ AI có thể thực hiện bất đồng bộ ở cấp hệ thống khi phù hợp, ví dụ quá trình phân tích CV.

## Scalability

Các module AI cần có khả năng tách khỏi backend nghiệp vụ.

## Availability

Lỗi AI Provider không được làm sập các chức năng tuyển dụng cơ bản.

Người dùng vẫn phải có thể:

- Xem Job.
- Apply.
- Quản lý Profile.
- Quản lý Application.

khi AI tạm thời không khả dụng.

## Maintainability

Các module:

- Business.
- AI.
- Retrieval.
- Recommendation.

cần được tách rõ ràng.

## Auditability

Các hành động quan trọng phải có khả năng truy vết.

---

# 50. Yêu cầu riêng tư dữ liệu

CV chứa dữ liệu cá nhân nên cần được bảo vệ.

Hệ thống cần hạn chế quyền truy cập CV theo mục đích tuyển dụng.

Candidate phải có quyền quản lý CV của chính mình.

Recruiter chỉ được truy cập CV khi có quyền nghiệp vụ phù hợp, ví dụ:

- Candidate đã apply.
- Candidate bật chế độ cho phép tìm kiếm.
- Hệ thống có chính sách Talent Search tương ứng.

Dữ liệu CV không được tự động công khai.

---

# 51. Phạm vi MVP

Phiên bản MVP tập trung:

### Authentication

- Register.
- Login.
- Roles.

### Candidate

- Profile.
- Skills.
- Experience.
- CV.

### Company

- Company Profile.
- Representative.
- HR Invitation.

### Recruitment

- Job.
- Job Skills.
- Application.
- Application Status.

### AI V1

- CV Parsing.
- Rule-based Matching.
- Basic Semantic Matching.
- Recommended Jobs.
- Recommended Candidates.
- Match Explanation.

### Copilot

- Candidate Assistant.
- Recruiter Assistant.
- Support Chat.

---

# 52. Phase 2

Sau MVP:

- Vector Database.
- Hybrid Semantic Search.
- Advanced Candidate Search.
- AI CV Builder hoàn thiện.
- Agent Tool Calling.
- Skill Gap Analysis.
- Job Market Insights.
- Advanced Analytics.
- Personalized recommendations.

---

# 53. Phase 3

Các hướng nghiên cứu nâng cao:

- Chunkless RAG.
- GraphRAG.
- LightRAG.
- Knowledge Graph.
- Learning-to-Rank.
- Behavior-based recommendation.
- Collaborative Filtering.
- Candidate-Job interaction learning.
- Interview recommendation.
- Hiring probability prediction.

---

# 54. Định hướng kiến trúc tổng thể

```text
                          SMART RECRUITMENT
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   Candidate                Recruiter               Representative
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                              Web App
                                 │
                                 ▼
                       ASP.NET Core Backend
                                 │
        ┌────────────────────────┼───────────────────────┐
        │                        │                       │
   Business Logic         Recommendation            AI Agent
        │                        │                       │
        ▼                        ▼                       ▼
     SQL DB              Matching Engine          CopilotKit
                                 │                       │
                    ┌────────────┼────────────┐          │
                    │            │            │          │
                   Rule        Vector       Graph        │
                   Match       Search       Search       │
                    │            │            │          │
                    └────────────┴────────────┴──────────┘
                                 │
                                LLM
```

---

# 55. Tuyên bố giá trị của sản phẩm

Smart Recruitment không được định vị đơn thuần là một website đăng và tìm việc.

Hệ thống được định vị là:

**Nền tảng kết nối ứng viên và nhà tuyển dụng thông minh dựa trên phân tích hồ sơ, AI Agent và hệ thống recommendation.**

Giá trị đối với ứng viên:

**Không chỉ tìm việc, mà tìm công việc phù hợp.**

Giá trị đối với nhà tuyển dụng:

**Không chỉ nhận CV, mà tìm ứng viên phù hợp.**

Giá trị của AI:

**Không thay thế quyết định của con người, mà giảm khối lượng tìm kiếm, phân tích và hỗ trợ người dùng đưa ra quyết định tốt hơn.**

---

# 56. Tiêu chí thành công

Hệ thống được xem là đạt mục tiêu cốt lõi khi có thể thực hiện xuyên suốt luồng:

### Candidate Flow

Candidate

→ tạo hồ sơ

→ tạo/import CV

→ AI phân tích CV

→ nhận Job Recommendation

→ xem Match Score

→ Apply

→ theo dõi Application.

### Recruiter Flow

Representative

→ tạo doanh nghiệp

→ mời Recruiter

→ Recruiter đăng Job

→ Candidate Apply

→ hệ thống Matching

→ Recruiter nhận Candidate Ranking

→ review CV

→ xử lý Application.

### AI Flow

User

→ Copilot

→ hiểu context

→ retrieve dữ liệu được phép

→ sử dụng AI

→ trả kết quả có căn cứ

→ không vượt qua authorization.

Khi ba luồng trên hoạt động thống nhất, Smart Recruitment đạt được mục tiêu cơ bản của một nền tảng tuyển dụng thông minh.