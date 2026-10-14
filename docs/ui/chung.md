# Mô tả giao diện — Chung (public + dùng chung)

> Quy ước: mỗi màn hình gồm mục đích, bố cục, thao tác chính và ô ảnh minh họa.
> Ảnh chụp màn hình đặt tại `docs/ui/images/`, đặt tên đúng như ghi dưới mỗi mục.

## 1. Trang chủ (`/`)

- **Mục đích:** Giới thiệu nền tảng HIREAI, dẫn luồng tìm việc/đăng nhập/đăng ký.
- **Bố cục:** Header public (nav Việc làm/Công ty/AI matching/Nhà tuyển dụng, nút Đăng nhập/Bắt đầu ngay) → Hero (tiêu đề, CTA, 3 số liệu) → khối Bắt đầu nhanh (AI match 92% + form đăng nhập + lối vào 2 vai trò) → Việc làm nổi bật (tìm kiếm + tags + 6 thẻ tin + Xem tất cả) → Trust Bar (marquee logo, số liệu, Quy chế) → Lĩnh vực công nghệ (4 thẻ) → Công ty nổi bật (4 thẻ) → 2 hành trình Ứng viên/Doanh nghiệp → AI match engine nền navy (3 năng lực) → Workflow → Footer navy (Nền tảng/Hỗ trợ/Pháp lý, MST, hotline).
- **Thao tác chính:** "Tìm việc phù hợp" → `/viec-lam`; "Dành cho nhà tuyển dụng" → `/nha-tuyen-dung`; đăng nhập inline; "Tôi tìm việc/Đăng ký" → `/register`; bấm thẻ tin → `/viec-lam?keyword=...`; bookmark lưu tin.

![Trang chủ](images/trang-chu.png)

## 2. Tin nhắn nội bộ (`/tin-nhan`)

- **Mục đích:** Chat nội bộ doanh nghiệp theo hội thoại nhóm qua SignalR.
- **Bố cục:** Tiêu đề + nút "Tạo hội thoại"; thẻ 2 cột: trái danh sách hội thoại (avatar, nhãn Nhóm, tìm kiếm); phải khung chat (tên + trạng thái online/connecting/offline, bong bóng tin căn trái/phải kèm giờ, "Đang kết nối...", ô nhập + nút Gửi); hộp thoại tạo nhóm (Tên hội thoại, Hủy/Tạo).
- **Thao tác chính:** "Tạo hội thoại" (chọn ngay sau khi tạo); bấm hội thoại tải tin + join hub; gửi tin (Enter gửi, Shift+Enter xuống dòng, chỉ khi online); "Làm mới" danh sách.

![Tin nhắn nội bộ](images/tin-nhan.png)

## 3. Cài đặt (`/settings`)

- **Mục đích:** Trang tự rẽ theo vai trò: cài đặt cá nhân/workspace hoặc hệ thống.
- **Bố cục:** Ứng viên/Nhà tuyển dụng: trang giữa (tiêu đề, Tabs Tài khoản/Thông báo/Bảo mật/Giao diện: dòng tên/email + "Mở hồ sơ", 2 dòng "Sắp ra mắt", form đổi mật khẩu + Đăng xuất, chọn Sáng/Tối/Hệ thống). Quản trị: Tabs Chung/Thông báo/Bảo mật/Tích hợp (ô disabled + nút Lưu disabled, các dòng "Sắp ra mắt", badge Google OAuth/CopilotKit).
- **Thao tác chính:** Chuyển Tabs; "Mở hồ sơ" → `/ho-so` (ứng viên) hoặc `/doanh-nghiep/ho-so`; đổi mật khẩu; đổi theme; Đăng xuất.

![Cài đặt](images/settings.png)

## 4. Quên mật khẩu (`/forgot-password`)

- **Mục đích:** Nhập email để nhận liên kết đặt lại mật khẩu.
- **Bố cục:** Khối căn giữa + thẻ (`max-w-md`): link quay lại đăng nhập, tiêu đề, form email (nhãn + ô nhập icon Mail), cảnh báo lỗi/thành công.
- **Thao tác chính:** "Gửi liên kết đặt lại" → hiện cảnh báo đã gửi; link về `/login`.

![Quên mật khẩu](images/forgot-password.png)

## 5. Đặt lại mật khẩu (`/reset-password`)

- **Mục đích:** Đặt mật khẩu mới từ liên kết email (kèm email + token).
- **Bố cục:** Khối căn giữa + thẻ (`max-w-md`, bọc Suspense): link quay lại, tiêu đề, form 2 ô mật khẩu/xác nhận (nút mắt hiện/ẩn), cảnh báo link thiếu/không hợp lệ.
- **Thao tác chính:** "Đặt lại mật khẩu" → thành công hiện cảnh báo + link "Đăng nhập ngay" về `/login`.

![Đặt lại mật khẩu](images/reset-password.png)

## 6. Xác thực Email (`/confirm-email`)

- **Mục đích:** Tự động xác minh email từ `userId` + `code` trên URL và báo kết quả.
- **Bố cục:** Khối căn giữa + thẻ (`max-w-md`); tiêu đề; 3 trạng thái: đang tải (spinner) / thành công (cảnh báo xanh) / lỗi (cảnh báo đỏ).
- **Thao tác chính:** "Quay lại trang Đăng nhập" về `/login`; không có form nhập liệu.

![Xác thực Email](images/confirm-email.png)

## 7. Đăng nhập Magic Link (`/magic-login`)

- **Mục đích:** Tự động xác thực đăng nhập không mật khẩu từ `token` + `email` (+ cổng, trang đích).
- **Bố cục:** Khối căn giữa + thẻ (`max-w-md`); tiêu đề; 3 trạng thái: đang tải / thành công (tự chuyển trang) / lỗi (cảnh báo + chi tiết).
- **Thao tác chính:** Lỗi thì "Quay lại trang Đăng nhập" (về cổng employer nếu `portal=employer`, ngược lại `/login`).

![Đăng nhập Magic Link](images/magic-login.png)

## 8. Chấp nhận lời mời (`/accept-invite`)

- **Mục đích:** Hiển thị và xử lý lời mời gia nhập doanh nghiệp theo `token` trên URL.
- **Bố cục:** Khối căn giữa + thẻ (`max-w-lg`): đầu thẻ icon + tiêu đề; hộp thông tin (tên doanh nghiệp/email/họ tên/chức vụ); cảnh báo theo trạng thái (đang tải/lỗi/sẵn sàng/thành công/từ chối).
- **Thao tác chính:** Chưa đăng nhập: link "Đăng nhập để chấp nhận", nút "Từ chối lời mời", link "Đăng ký bằng lời mời"; đã đăng nhập: "Chấp nhận/Từ chối lời mời"; xong thì link "Vào trang quản trị" hoặc "Đăng nhập lại".

![Chấp nhận lời mời](images/accept-invite.png)

## 9. Đăng ký nhà tuyển dụng (`/employer/register`)

- **Mục đích:** Tạo tài khoản doanh nghiệp qua 3 bước, rồi chuyển sang đăng nhập cổng employer.
- **Bố cục:** 2 cột (trái: headline + 3 bước Liên hệ/Công ty/Tuyển dụng); phải: badge, thanh bước, form theo bước (B1: họ tên/SĐT/email/mật khẩu/xác nhận; B2: tên/địa chỉ công ty, chức vụ, lĩnh vực, quy mô, website, mã số thuế; B3: nhu cầu onboarding), cảnh báo lỗi.
- **Thao tác chính:** "Tiếp tục" (validate từng bước) / "Quay lại" / "Hoàn tất đăng ký" (vai Người đại diện) → `/employer/login`; links "Đăng nhập" và "Đăng ký ứng viên".

![Đăng ký nhà tuyển dụng](images/employer-register.png)

## 10. Dành cho nhà tuyển dụng (`/nha-tuyen-dung`)

- **Mục đích:** Landing giới thiệu giải pháp tuyển dụng IT cho doanh nghiệp.
- **Bố cục:** Header public + hero + thẻ giá trị + lưới số liệu (3.2x/92%/<48h/500+) + 3 khối tính năng + quy trình 3 bước + CTA nền navy + footer mini.
- **Thao tác chính:** "Đăng tuyển ngay"/"Đăng ký tài khoản doanh nghiệp" → `/employer/register`; "Đăng nhập" → `/employer/login`; "Liên hệ tư vấn" → `/lien-he`.

![Dành cho nhà tuyển dụng](images/nha-tuyen-dung.png)

## 11. Trung tâm hỗ trợ (`/ho-tro`)

- **Mục đích:** Trang giữ chỗ, điều hướng sang liên hệ.
- **Bố cục:** Khối căn giữa: tiêu đề + 1 dòng text.
- **Thao tác chính:** Link `/lien-he` và "Về trang chủ".

![Trung tâm hỗ trợ](images/ho-tro.png)

## 12. Liên hệ (`/lien-he`)

- **Mục đích:** Kênh liên hệ/hotline và form gửi tin nhắn hỗ trợ/khiếu nại.
- **Bố cục:** Header + về trang chủ; lưới 2 cột: trái (badge, tiêu đề, 3 thẻ Hotline/Email/Văn phòng, box khiếu nại + link quy chế); phải thẻ "Gửi tin nhắn" (Họ tên/Email/Chủ đề/Nội dung) + box thành công (mã ticket).
- **Thao tác chính:** "Gửi liên hệ" (lưu local + toast, không gọi API); links Điều khoản/Bảo mật.

![Liên hệ](images/lien-he.png)

## 13. Câu hỏi thường gặp (`/cau-hoi-thuong-gap`)

- **Mục đích:** Trang giữ chỗ FAQ (chưa có nội dung thật).
- **Bố cục:** Khối căn giữa: tiêu đề + 1 dòng.
- **Thao tác chính:** Link `/lien-he` và "Về trang chủ".

![Câu hỏi thường gặp](images/cau-hoi-thuong-gap.png)

## 14. Hướng dẫn ứng viên (`/huong-dan`)

- **Mục đích:** Trang giữ chỗ, gợi ý sang flow tạo CV.
- **Bố cục:** Khối căn giữa: tiêu đề + 1 dòng.
- **Thao tác chính:** Link "Tạo CV" (`/tao-cv`) và "Về trang chủ".

![Hướng dẫn ứng viên](images/huong-dan.png)

## 15. Hướng dẫn nhà tuyển dụng (`/huong-dan-nha-tuyen-dung`)

- **Mục đích:** Trang giữ chỗ hướng dẫn đăng tin/matching.
- **Bố cục:** Khối căn giữa: tiêu đề + 1 dòng.
- **Thao tác chính:** Link `/lien-he` và "Về trang chủ".

![Hướng dẫn nhà tuyển dụng](images/huong-dan-nha-tuyen-dung.png)

## 16. Quy chế hoạt động (`/quy-che`)

- **Mục đích:** Quy chế sàn giao dịch việc làm (theo NĐ 52/2013, TT 59/2015).
- **Bố cục:** Header + về trang chủ; badge + tiêu đề; thẻ nội dung (nguyên tắc kiểm duyệt, quyền/nghĩa vụ 2 cột, cơ chế giải quyết tranh chấp 4 bước, xử lý vi phạm, box thông tin sàn).
- **Thao tác chính:** Chỉ đọc + links chéo Điều khoản/Bảo mật/Liên hệ/email.

![Quy chế hoạt động](images/quy-che.png)

## 17. Điều khoản dịch vụ (`/dieu-khoan`)

- **Mục đích:** Điều khoản áp dụng khi tạo tài khoản (ứng viên + NTD).
- **Bố cục:** Header + về trang chủ; badge + tiêu đề; thẻ 4 mục (Định nghĩa/ Tài khoản/Phí & Thanh toán/Quyền sở hữu & AI); box pháp chế.
- **Thao tác chính:** Chỉ đọc + links Bảo mật/Quy chế.

![Điều khoản dịch vụ](images/dieu-khoan.png)

## 18. Chính sách bảo mật (`/bao-mat`)

- **Mục đích:** Chính sách bảo mật và dữ liệu cá nhân (NĐ 13/2023).
- **Bố cục:** Header + về trang chủ; badge + tiêu đề; chips neo (`#du-lieu-ca-nhan`/`#cookies`/`#quyen`); thẻ nội dung (dữ liệu cá nhân, bảo mật kỹ thuật, Cookie, quyền & khiếu nại); box cập nhật v2.1.
- **Thao tác chính:** Chỉ đọc + neo nội bộ + email + links Liên hệ/Điều khoản/Quy chế.

![Chính sách bảo mật](images/bao-mat.png)

## 19. Duyệt tin tuyển dụng (`/regulatory-requests`)

- **Mục đích:** Trang giữ chỗ duyệt tin (chưa có logic thật).
- **Bố cục:** Tiêu đề + icon; 3 thẻ thống kê mẫu (giá trị "—"); thẻ danh sách trống "Chức năng đang được phát triển".
- **Thao tác chính:** Không có (trang tĩnh).

![Duyệt tin tuyển dụng](images/regulatory-requests.png)

## 20. Không có quyền (`/unauthorized`)

- **Mục đích:** Báo lỗi 403 khi thiếu quyền xem trang.
- **Bố cục:** Khối căn giữa toàn màn hình: icon, tiêu đề "403 — Không có quyền truy cập", mô tả liên hệ quản trị.
- **Thao tác chính:** "Quay về Dashboard" → `/dashboard`.

![Không có quyền](images/unauthorized.png)

## 21. Trang ví dụ (`/example`)

- **Mục đích:** Trang giữ chỗ đang phát triển.
- **Bố cục:** Tiêu đề "Ví dụ" + 1 dòng mô tả.
- **Thao tác chính:** Không có.

![Trang ví dụ](images/example.png)
