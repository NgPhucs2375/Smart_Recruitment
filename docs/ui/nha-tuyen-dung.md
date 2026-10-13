# Mô tả giao diện — Tuyến Nhà tuyển dụng

> Quy ước: mỗi màn hình gồm mục đích, bố cục, thao tác chính và ô ảnh minh họa.
> Ảnh chụp màn hình đặt tại `docs/ui/images/`, đặt tên đúng như ghi dưới mỗi mục.

## 1. Đăng nhập nhà tuyển dụng (`/employer/login`)

- **Mục đích:** Đăng nhập cổng doanh nghiệp HIREAI (vai trò Người đại diện / Nhân sự).
- **Bố cục:** 2 cột; trái (nhãn Enterprise Portal, tiêu đề chào mừng, thẻ "Pipeline tuần này" 4 ô Mới/Sàng lọc/Phỏng vấn/Offer + tỷ lệ lấp đầy 78%, 3 thẻ lợi ích AI đối chiếu/pipeline/phân quyền, dòng SSO); phải (badge "Cổng nhà tuyển dụng", form Email doanh nghiệp + Mật khẩu + "Quên mật khẩu?" + nút hiện/ẩn + nút "Đăng nhập", divider "hoặc", nút Google/GitHub, chân đăng ký/ứng viên).
- **Thao tác chính:** "Đăng nhập" (mật khẩu/Google/GitHub); "Quên mật khẩu?" → `/forgot-password`; "Đăng ký tuyển dụng" → `/employer/register`; "Đăng nhập ứng viên" → `/login`.

![Đăng nhập nhà tuyển dụng](images/employer-login.png)

## 2. Quản lý tin tuyển dụng (`/tin-tuyen-dung`)

- **Mục đích:** Tạo, sửa, gửi duyệt và theo dõi trạng thái các tin tuyển dụng của doanh nghiệp.
- **Bố cục:** Tiêu đề + nút "Chờ tôi duyệt" (vai Người đại diện) + "Tạo tin mới"; banner thành công/lỗi; form tạo/sửa (Tiêu đề, Danh mục nghề, Địa điểm, Phương thức làm việc, Ngày hết hạn, Lương tối thiểu/tối đa, Mô tả/Yêu cầu/Kinh nghiệm/Quyền lợi, Kỹ năng yêu cầu + mức độ); thẻ danh sách tin (ô tìm, lọc trạng thái, từng dòng: tiêu đề + nhãn trạng thái + địa điểm/lương/hết hạn + ghi chú kiểm duyệt); phân trang; hộp xem trước tin.
- **Thao tác chính:** "Tạo tin mới", "Lưu nháp", "Lưu và gửi duyệt"; "Xem trước/Chi tiết/Xem và duyệt", "Gửi duyệt", "Tạm dừng", "Đóng tin", "Sửa", "Sao chép", xóa nháp; xem ứng viên → `/tin-tuyen-dung/[id]/ung-vien`; Người đại diện: "Từ chối" / "Đồng ý và chạy bộ lọc".

![Quản lý tin tuyển dụng](images/tin-tuyen-dung.png)

## 3. Danh sách ứng viên theo tin (`/tin-tuyen-dung/[id]/ung-vien`)

- **Mục đích:** Xem và xử lý các đơn ứng tuyển nộp vào một tin cụ thể.
- **Bố cục:** Link "Về quản lý tin"; thẻ đầu trang (Tin #id + tiêu đề tin); thẻ danh sách đơn (mỗi đơn: avatar 2 chữ cái, tên hồ sơ, nhãn trạng thái, dòng "Đơn # · CV # · Nộp ngày", ghi chú, dòng đánh giá); hộp thoại "Đánh giá & kết luận" (Nhận xét, Kết luận, Hủy/Lưu).
- **Thao tác chính:** "Xem CV" (tự đánh dấu đã xem nếu đơn chờ xử lý); "Duyệt phù hợp"; "Từ chối" (nhập lý do); "Đánh giá" khi đơn đã phù hợp; "Về quản lý tin" → `/tin-tuyen-dung`.

![Danh sách ứng viên theo tin](images/tin-ung-vien.png)

## 4. Xem CV ứng viên — HR (`/tin-tuyen-dung/[id]/ung-vien/cv/[cvId]`)

- **Mục đích:** HR xem chi tiết chỉ-đọc CV ứng viên đã nộp vào tin mình phụ trách.
- **Bố cục:** Link "Về danh sách ứng viên"; thẻ đầu trang ("CV ứng viên (chỉ xem)" + tên file + họ tên + nút "Duyệt phù hợp"); khung xem trước CV.
- **Thao tác chính:** "Duyệt phù hợp" (xong quay về trang trước); "Về danh sách ứng viên".

![Xem CV ứng viên](images/xem-cv-hr.png)

## 5. Hồ sơ doanh nghiệp (`/doanh-nghiep/ho-so`)

- **Mục đích:** Xem và cập nhật thông tin doanh nghiệp của chính user (chỉ Người đại diện được sửa).
- **Bố cục:** Tiêu đề "Hồ sơ doanh nghiệp"; banner thành công/lỗi; thẻ form lưới 2 cột (Tên doanh nghiệp, Website, Mã số thuế, Lĩnh vực, Quy mô, Logo URL, Địa chỉ, Mô tả); nút "Lưu thay đổi" (chỉ hiện khi được sửa, vai Nhân sự chỉ xem).
- **Thao tác chính:** "Lưu thay đổi" (tạo mới nếu chưa có công ty, cập nhật nếu đã có).

![Hồ sơ doanh nghiệp](images/doanh-nghiep-ho-so.png)

## 6. Quản lý nhân sự (`/nhan-su`)

- **Mục đích:** Mời và quản lý nhân sự thuộc cùng doanh nghiệp.
- **Bố cục:** Tiêu đề + nút "Mời nhân sự"; form mời (Email, Họ tên, Chức vụ, Hủy/Gửi); hộp "Link lời mời" + "Sao chép link"; thẻ "Lời mời đang chờ" (email + nhãn chờ + link + Copy/Hủy); thẻ danh sách nhân sự (họ tên + nhãn vai trò + chức vụ + nút xóa).
- **Thao tác chính:** "Mời nhân sự" (gửi email, link dự phòng `/accept-invite?token=`); "Sao chép link"; "Hủy" lời mời; xóa nhân sự.

![Quản lý nhân sự](images/nhan-su.png)

## Phụ lục: các màn hình còn lại (tuyến nhà tuyển dụng)

| Route | Mục đích |
|---|---|
| `/employer/register` | Đăng ký tài khoản doanh nghiệp nhiều bước |
| `/ho-so-nha-tuyen-dung` | Quản lý hồ sơ cá nhân nhà tuyển dụng |
| `/duyet-tin-nhan-su` | Người đại diện duyệt tin nhân sự đăng |
| `/ky-nang-tin-tuyen-dung` | Gán mức yêu cầu kỹ năng cho tin |
