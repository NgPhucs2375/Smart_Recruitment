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

## Phụ lục: các màn hình còn lại (public/dùng chung)

| Route | Mục đích |
|---|---|
| `/forgot-password` | Gửi email khôi phục mật khẩu |
| `/reset-password` | Đặt mật khẩu mới bằng token |
| `/confirm-email` | Xác thực email sau đăng ký |
| `/magic-login` | Đăng nhập không mật khẩu qua email |
| `/accept-invite` | Chấp nhận/từ chối lời mời doanh nghiệp |
| `/employer/register` | Đăng ký tài khoản doanh nghiệp nhiều bước |
| `/nha-tuyen-dung` | Landing giới thiệu giải pháp tuyển dụng |
| `/ho-tro` | Placeholder trung tâm hỗ trợ |
| `/lien-he` | Form/thông tin liên hệ HIREAI |
| `/huong-dan` | Placeholder hướng dẫn ứng viên |
| `/huong-dan-nha-tuyen-dung` | Placeholder hướng dẫn nhà tuyển dụng |
| `/quy-che` | Quy chế sàn giao dịch việc làm |
| `/dieu-khoan` | Điều khoản dịch vụ |
| `/bao-mat` | Chính sách bảo mật, dữ liệu cá nhân |
| `/regulatory-requests` | Placeholder trang hệ thống |
| `/unauthorized` | Báo lỗi 403 thiếu quyền |
| `/example` | Trang mẫu đang phát triển |
