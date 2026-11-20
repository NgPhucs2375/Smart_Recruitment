# ĐỀ CƯƠNG TINH GỌN SLIDE BẢO VỆ KHÓA LUẬN TỐT NGHIỆP – HIREAI

**Mục tiêu tối ưu:** Rút gọn từ **29 slides** xuống còn **14 slides** (giảm 52% thời lượng trình bày, phù hợp khung thời gian 12–15 phút trước Hội đồng), loại bỏ sự trùng lặp sơ đồ và làm nổi bật các điểm nhấn công nghệ cốt lõi (**Trợ lý AI Adam** và **Thuật toán gợi ý hai chiều CBF**).

---

## PHẦN 1: MỞ ĐẦU & ĐẶT VẤN ĐỀ (3 SLIDES)

### Slide 1: Trang bìa
* **Cơ quan chủ quản:** Bộ Công Thương – Trường Đại học Công Thương TP. Hồ Chí Minh (HUIT)
* **Tên đề tài:** Phát triển hệ thống Website tuyển dụng thông minh kết nối ứng viên và nhà tuyển dụng (HireAI)
* **Loại hình:** Khóa luận cử nhân – Ngành Công nghệ thông tin
* **Sinh viên thực hiện:** Trần Nguyên Phúc – Nguyễn Quốc Khánh – Vũ Thiên Trường (Lớp 14DHTH13)
* **Giảng viên hướng dẫn:** TS. Phạm Văn Đăng
* **Thời gian:** TP. Hồ Chí Minh – Tháng 11/2026
* *Lưu ý thiết kế:* Chỉnh sửa lại phần ảnh bìa để loại bỏ các dòng chữ bị chồng/lỗi hiển thị ở góc trên và góc dưới.

### Slide 2: Nội dung báo cáo
Tóm gọn 6 mục ban đầu thành **4 phần mạch lạc**:
1. **Đặt vấn đề & Mục tiêu đề tài**
2. **Kiến trúc & Công nghệ nền tảng**
3. **Trợ lý AI Adam & Thuật toán gợi ý CBF**
4. **Triển khai, Giao diện & Kết luận**

### Slide 3: Thực trạng & Kết quả khảo sát *(Gộp Slide 3 + 4 + 5)*
* **Bối cảnh khảo sát:** Khảo sát thực tế **57 người tìm việc** (50,9% sinh viên, 49,1% người đi làm) và phỏng vấn **3 chuyên viên tuyển dụng** (tháng 8 – 11/2026).
* **Số liệu nổi bật (Trình bày dạng Big Numbers thay cho ảnh chụp biểu đồ):**
  * **87,7%** ứng viên gặp khó khăn khi tạo CV và mong muốn AI hỗ trợ.
  * **66,7%** người tìm việc bị quá tải trước lượng tin tuyển dụng lớn, khó xác định công việc phù hợp.
  * **3/3 doanh nghiệp** tốn nhiều thời gian sàng lọc, đối chiếu CV thủ công với yêu cầu vị trí.

---

## PHẦN 2: GIẢI PHÁP & KIẾN TRÚC HỆ THỐNG (4 SLIDES)

### Slide 4: Giải pháp đề xuất & Phạm vi hệ thống *(Gộp Slide 6 + 7)*
* **Mục tiêu tổng quát:** Xây dựng hệ sinh thái tuyển dụng thông minh đa nền tảng (Web & Mobile) hỗ trợ kết nối, tạo CV và quản lý quy trình tuyển dụng tự động.
* **4 nhóm vai trò chính:** Ứng viên, Nhân sự, Người đại diện doanh nghiệp, Quản trị viên.
* **2 tính năng đột phá:**
  * **Trợ lý AI hội thoại (Adam):** Hỗ trợ tra cứu và biên tập nội dung CV theo thời gian thực.
  * **Đối sánh hai chiều (CBF):** Gợi ý việc làm phù hợp cho ứng viên và đề xuất ứng viên tiềm năng cho nhà tuyển dụng.

### Slide 5: Công nghệ nền tảng *(Tinh gọn Slide 8)*
Trình bày dưới dạng **sơ đồ khối 3 tầng**:
* **Tầng Giao diện (Client):**
  * *Website:* Next.js 16, React 19, TypeScript, Tailwind CSS, Refine.
  * *Mobile App:* React Native 0.88, Expo.
* **Tầng Xử lý & AI (Backend & AI):**
  * *Core:* .NET 10, Clean Architecture, CQRS (MediatR, FluentValidation, AutoMapper).
  * *Bảo mật & Realtime:* ASP.NET Identity, JWT, Google/GitHub OAuth, Permission Policy, SignalR.
  * *AI Stack:* DeepSeek, Microsoft Agent Framework, CopilotKit v2, AG-UI, thuật toán CBF.
* **Tầng Dữ liệu & Lưu trữ (Data & Storage):**
  * PostgreSQL 16 (EF Core, Npgsql), Redis 7 (Cache), RustFS (Object Storage chuẩn S3).

### Slide 6: Kiến trúc hệ thống & Cơ sở dữ liệu *(Gộp Slide 10 + 15 + 16 + 17)*
* **Kiến trúc Clean Architecture 5 lớp:** `Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure` $\rightarrow$ `WebApi` $\rightarrow$ `External Services`.
* **Tách biệt ngữ cảnh dữ liệu (DbContext):**
  * `ApplicationDbContext`: Quản lý dữ liệu nghiệp vụ cốt lõi (Doanh nghiệp, Tin tuyển dụng, Hồ sơ, CV, Đơn ứng tuyển, Kết quả phù hợp).
  * `IdentityContext`: Chuyên trách xác thực tài khoản và ma trận phân quyền.
* *Ghi chú trình bày:* Chuyển các sơ đồ chi tiết (Use Case, Class CQRS, ERD từng cụm) sang Slide Phụ lục cuối bài để phòng khi Hội đồng đặt câu hỏi chuyên sâu.

### Slide 7: Quy trình nghiệp vụ & State Machine *(Gộp Slide 11 + 12 + 13 + 14)*
* **Cơ chế quản lý trạng thái:** Sử dụng thư viện **Stateless** kết hợp **WorkflowService** để kiểm soát chặt chẽ 3 vòng đời: *Tin tuyển dụng, Đơn ứng tuyển, Lời mời nhân sự*.
* **Sơ đồ luồng kiểm duyệt tin tuyển dụng tự động:**
  `Nháp` $\rightarrow$ `Người đại diện duyệt` $\rightarrow$ `Job nền quét mỗi 30 giây` $\rightarrow$
  * **Đạt (Điểm an toàn $\ge 85$, không từ cấm):** Tự động chuyển trạng thái **Đang tuyển**.
  * **Cảnh báo vi phạm:** Chuyển **Quản trị viên duyệt thủ công**.
  * *(Job kiểm tra tin hết hạn tự động quét mỗi 1 giờ)*.

---

## PHẦN 3: ĐIỂM NHẤN AI & THUẬT TOÁN (2 SLIDES)

### Slide 8: Trợ lý AI hội thoại Adam *(Tinh gọn Slide 18)*
* **Luồng xử lý hội thoại 4 chặng:**
  `Giao diện Web (CopilotKit v2)` $\rightarrow$ `Next.js Proxy (/api/copilotkit)` $\rightarrow$ `ASP.NET Core (AG-UI + xác thực JWT)` $\rightarrow$ `Agent Adam & Backend/UI Tools`.
* **Cơ chế kiểm soát an toàn:**
  * Phân định rõ Agent theo vai trò (*Ứng viên* vs *Nhà tuyển dụng*), không cấp quyền truy cập toàn bộ CSDL.
  * AI chỉ thao tác trên bản nháp CV đang mở; người dùng kiểm duyệt và chủ động nhấn **Lưu CV** để ghi nhận phiên bản lên máy chủ.

### Slide 9: Thuật toán gợi ý hai chiều CBF *(Tinh gọn Slide 19)*
* **Công thức tính điểm kỹ năng (`cbf-v7-idf`):**
  $$\text{Điểm kỹ năng} = \min\left(100\%, \frac{W_{\text{khớp}} + 5 \times 0,4}{W_{\text{tổng}} + 5}\right)$$
  * Trong đó $W_{\text{khớp}}$ tính theo trọng số yêu cầu (**Bắt buộc: 3** | **Ưu tiên: 2** | **Khác: 1**) $\times$ hệ số **IDF** $\times$ hệ số trình độ.
* **Điều chỉnh ngữ cảnh & Xếp hạng:**
  * Cộng/trừ điểm ngữ cảnh: Vị trí mong muốn (`+10%`), Mức lương (`+5%`), Địa điểm (`+2,5%` đến `+5%`), Kinh nghiệm (`-5%` đến `+5%`).
  * Phân loại mức độ: **Thấp ($< 33\%$)** | **Trung bình ($33\% - < 66\%$)** | **Cao ($\ge 66\%$)**.
  * Tích hợp **DeepSeek** hỗ trợ sắp xếp lại Top 10 kết quả phù hợp nhất (không làm sai lệch điểm gốc).

---

## PHẦN 4: TRIỂN KHAI, GIAO DIỆN & KẾT LUẬN (5 SLIDES)

### Slide 10: Môi trường triển khai & Kiểm thử *(Gộp Slide 20 + 21)*
* **Đóng gói & Triển khai:**
  * Đóng gói toàn bộ dịch vụ (*Frontend, Backend, PostgreSQL, Redis, RustFS*) bằng **Docker Compose** trong mạng nội bộ `kltn_network`.
  * Triển khai môi trường Production trên **Google Cloud Compute Engine + Nginx** tại địa chỉ: `https://hireais.dev`.
  * Tích hợp CI/CD cơ bản với **GitHub Actions** (kiểm tra ESLint, TypeScript và `dotnet build`).
* **Kết quả kiểm thử:** Ghi nhận **61/61 test cases đạt** trên cả hai môi trường Local và Production.

### Slide 11: Giao diện Web – Ứng viên & AI CV Studio *(Gộp Slide 22 + 23 + 24)*
* **Bố cục đề xuất:** Đặt **2 ảnh chụp màn hình lớn cạnh nhau** (lược bỏ màn hình đăng nhập/đăng ký):
  1. **Dashboard Ứng viên & Tìm việc:** Hiển thị chỉ số hồ sơ, bộ lọc đa tiêu chí và danh sách việc làm do Adam gợi ý.
  2. **AI CV Studio:** Trình soạn thảo CV 2 cột, tích hợp khung chat với **Adam** để viết lại nội dung và xem trước bản in A4 theo thời gian thực.

### Slide 12: Giao diện Web – Nhà tuyển dụng & Quản trị *(Tinh gọn Slide 25)*
* **Bố cục đề xuất:** Đặt **2 ảnh chụp màn hình cạnh nhau**:
  1. **Không gian Tuyển dụng:** Quản lý tin đăng, theo dõi trạng thái duyệt nhiều tầng và danh sách ứng viên.
  2. **Ma trận Phân quyền động (Admin):** Cấu hình trực quan quyền hạn (`Role` $\times$ `Resource` $\times$ `Action`) dựa trên `PermissionPolicy`.

### Slide 13: Giao diện Ứng dụng Di động (Mobile App) *(Gộp Slide 26 + 27)*
* **Bố cục đề xuất:** Ghép **3 khung màn hình điện thoại** trên cùng một slide:
  1. **Màn hình Tìm việc (Ứng viên):** Hiển thị tỷ lệ *AI Match* và lọc nhanh công việc.
  2. **Màn hình Hồ sơ cá nhân (Ứng viên):** Theo dõi mức độ hoàn thiện hồ sơ và trạng thái bật tìm việc.
  3. **Dashboard Tuyển dụng (Doanh nghiệp):** Thống kê nhanh tin đang tuyển, lượt ứng tuyển và quản lý lời mời nhân sự.

### Slide 14: Kết luận, Hạn chế & Hướng phát triển *(Gộp Slide 28 + 29)*
Chia làm **2 cột đối xứng**:

| Kết quả đạt được | Hạn chế & Hướng phát triển |
| :--- | :--- |
| • Hoàn thiện hệ thống tuyển dụng đa nền tảng (**Web & Mobile**) phục vụ đầy đủ 4 vai trò.<br>• Xây dựng thành công trợ lý AI hội thoại **Adam** và bộ máy đối sánh hai chiều **CBF**.<br>• Vận hành ổn định trên Cloud (`hireais.dev`), vượt qua **61/61** kịch bản kiểm thử. | • **Hạn chế:** Quy mô khảo sát còn nhỏ; thuật toán CBF chưa được đánh giá trên tập dữ liệu độc lập có nhãn; AI còn phụ thuộc dịch vụ bên thứ ba.<br>• **Hướng phát triển:** Xây dựng tập dữ liệu chuẩn có nhãn để tinh chỉnh mô hình CBF; mở rộng quyền xem tin cho khách vãng lai và tối ưu hiệu năng đa thiết bị. |

---

## BẢNG TỔNG HỢP LỘ TRÌNH RÚT GỌN

| Cụm nội dung | Slide gốc | Đề xuất mới | Mức tinh gọn |
| :--- | :---: | :---: | :---: |
| Mở đầu, Khảo sát, Giải pháp, Mục tiêu | 7 slides (1–7) | **4 slides (1–4)** | Giảm 3 slides |
| Cơ sở lý thuyết, Phân tích & Thiết kế | 10 slides (8–17) | **3 slides (5–7)** | Giảm 7 slides |
| Trợ lý AI Adam & Thuật toán CBF | 2 slides (18–19) | **2 slides (8–9)** | Giữ nguyên trọng tâm |
| Triển khai & Giao diện Web/Mobile | 8 slides (20–27) | **4 slides (10–13)** | Giảm 4 slides |
| Kết luận, Hạn chế & Hướng phát triển | 2 slides (28–29) | **1 slide (14)** | Giảm 1 slide |
| **TỔNG CỘNG** | **29 slides** | **14 slides** | **Giảm 52%** |