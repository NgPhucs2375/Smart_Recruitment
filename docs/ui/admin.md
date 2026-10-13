# Mô tả giao diện — Tuyến Quản trị viên

> Quy ước: mỗi màn hình gồm mục đích, bố cục, thao tác chính và ô ảnh minh họa.
> Ảnh chụp màn hình đặt tại `docs/ui/images/`, đặt tên đúng như ghi dưới mỗi mục.

## 1. Bảng điều khiển (`/dashboard`)

- **Mục đích:** Màn hình chung tự rẽ nhánh theo vai trò (ứng viên / nhân sự / người đại diện / quản trị viên).
- **Bố cục (nhánh quản trị):** Component `AdminDashboard` (KPI + biểu đồ + việc cần xử lý). Các nhánh khác: ứng viên (lời chào, KPI, gợi ý phù hợp, đơn gần đây, tiến độ hồ sơ), tuyển dụng (KPI, biểu đồ 7 ngày, pipeline 4 giai đoạn, lịch, bảng tin, hoạt động).
- **Thao tác chính:** Điều hướng nhanh sang việc làm, CV, hồ sơ, tin tuyển dụng, nhân sự theo từng thẻ.

![Bảng điều khiển](images/dashboard.png)

## 2. Quản trị người dùng (`/admin/nguoi-dung`)

- **Mục đích:** Quản lý hồ sơ người dùng, phân vai trò và khóa/mở/xóa tài khoản đăng nhập.
- **Bố cục:** Tiêu đề (icon Users) + cụm nút; thẻ tìm kiếm; thẻ form thêm/sửa hiện có điều kiện (mã Identity, vai trò, checkbox hoạt động); thẻ bảng (cột Id, Email, Tên đăng nhập, Vai trò, Trạng thái, Thao tác).
- **Thao tác chính:** Tải lại, Thêm người dùng, Tìm, Lưu/Hủy, Sửa từng dòng, Khóa/Mở khóa (hộp xác nhận), Xóa (hộp xác nhận).

![Quản trị người dùng](images/admin-nguoi-dung.png)

## 3. Quản trị doanh nghiệp (`/admin/doanh-nghiep`)

- **Mục đích:** CRUD hồ sơ doanh nghiệp (tên, mã số thuế, lĩnh vực, quy mô...).
- **Bố cục:** Tiêu đề (icon Building2) + cụm nút; thẻ tìm kiếm theo tên; thẻ form thêm/sửa (tên, mô tả, website, địa chỉ, logo URL, mã số thuế, lĩnh vực, quy mô); thẻ bảng (Id, Tên, Mã số thuế, Lĩnh vực, Quy mô, Thao tác).
- **Thao tác chính:** Tải lại, Thêm, Tìm, Lưu/Hủy, Sửa/Xóa từng dòng (hộp xác nhận).

![Quản trị doanh nghiệp](images/admin-doanh-nghiep.png)

## 4. Quản trị tin tuyển dụng (`/admin/tin-tuyen-dung`)

- **Mục đích:** Kiểm duyệt các tin bị gắn cờ sau bước Người đại diện: duyệt tay, từ chối hoặc cưỡng chế khóa.
- **Bố cục:** Tiêu đề + nút Tải lại; thẻ tìm kiếm (tiêu đề + dropdown trạng thái mặc định chờ admin duyệt + nút Tìm); thẻ bảng (Id, Tiêu đề dạng link, Trạng thái, Doanh nghiệp, Thao tác); phân trang; hộp xem trước tin kèm kỹ năng yêu cầu.
- **Thao tác chính:** Mở xem trước ("Xem và duyệt/Chi tiết"), "Duyệt và công khai", "Từ chối" (nhập lý do), "Cưỡng chế khóa" (khi Đang tuyển/Tạm dừng), Xóa (chỉ tin Nháp/Từ chối).

![Quản trị tin tuyển dụng](images/admin-tin-tuyen-dung.png)

## 5. Quản lý mẫu CV (`/admin/cv/themes`)

- **Mục đích:** Quản lý toàn bộ theme/mẫu CV qua 2 góc nhìn: thư viện trực quan và metadata.
- **Bố cục:** Hàng tabs ("Thư viện mẫu" / "Metadata & AI") + nút "Mở Theme Studio" bên phải; tab thư viện (lưới thẻ mẫu render thật, tải lười) hoặc tab metadata (bảng CRUD tải lười); skeleton khi tải.
- **Thao tác chính:** Chuyển tab; "Mở Theme Studio" → `/tao-theme-cv`; "Sửa" mẫu trong thư viện → `/tao-theme-cv?slug=<slug>`.

![Quản lý mẫu CV](images/admin-cv-themes.png)

## 6. Xưởng theme CV (`/tao-theme-cv`)

- **Mục đích:** Soạn/sửa theme CV trực quan với xem trước trực tiếp và kiểm định trước khi xuất bản.
- **Bố cục:** Breadcrumb + tiêu đề "Tạo/Sửa theme CV" + cụm nút (Quay lại danh sách, Hủy/Làm mới, Lưu Theme); lưới 2 cột: dock trái dạng tab (Bố cục: khung 1 cột/sidebar/banner, avatar, kéo-thả thứ tự, preset Fresher/Pro; Màu sắc: preset + màu chủ đạo/phụ/chữ/nền + màu phân vùng; Chữ: font, cỡ chữ, kiểu header, divider, khung section, nhãn dọc; Xuất bản: tên, mô tả, slug, danh mục, cấp bậc, ATS, hiển thị, checklist audit, duyệt phát hành, ghi chú, Lưu/Xóa); phải xem trước trực tiếp (dữ liệu giả, chuyển Fit/100%).
- **Thao tác chính:** "Quay lại danh sách" → `/admin/cv/themes`; "Lưu Theme" (đồng bộ DB) → về bảng; "Xóa theme"; chế độ sửa nạp qua `?slug=`/`?id=`.

![Xưởng theme CV](images/tao-theme-cv.png)

## 7. Báo cáo và thống kê (`/reports`)

- **Mục đích:** Khung báo cáo hiệu suất tuyển dụng (hiện là placeholder chờ API).
- **Bố cục:** Tiêu đề + mô tả; 3 thẻ số liệu (Tin/Ứng viên/Lượt ứng tuyển — đều "—"); 2 thẻ (Xu hướng tuyển dụng, Phân tích hiệu suất) chứa trạng thái trống "Dữ liệu chưa khả dụng".
- **Thao tác chính:** Không có (trang tĩnh chờ API).

![Báo cáo và thống kê](images/reports.png)

## 8. Quản trị danh mục (`/admin/danh-muc`)

- **Mục đích:** Quản lý danh mục dùng chung toàn hệ thống (Ngành nghề, Kỹ năng).
- **Bố cục:** Tiêu đề (icon Tags); thẻ chứa tabs Ngành nghề/Kỹ năng, mỗi tab: form tìm kiếm + thẻ form (Tên/Mô tả) + bảng (Id/Tên/Mô tả/Thao tác) + skeleton khi tải.
- **Thao tác chính:** Tìm, Tải lại, Thêm, Lưu/Hủy, Sửa/Xóa từng dòng; không điều hướng.

![Quản trị danh mục](images/admin-danh-muc.png)

## 9. Quản trị CV (`/admin/cv`)

- **Mục đích:** Route trung gian tự chuyển hướng sang `/admin/cv/themes`.
- **Bố cục:** Không có giao diện (redirect).
- **Thao tác chính:** Không có (tự chuyển trang).

## 10. Tra cứu CV ứng viên (`/admin/cv/ung-vien`)

- **Mục đích:** Tra cứu thông tin một CV theo ID (chưa có endpoint liệt kê toàn hệ thống cho admin).
- **Bố cục:** Thẻ "Tra cứu CV ứng viên" (mô tả giới hạn, ô nhập ID CV); lưới chi tiết (ID/Tên file/Mẫu/Ứng viên/Vị trí/Ngày tải); skeleton khi tải.
- **Thao tác chính:** Nhập ID + "Tra cứu" (Enter cũng chạy); không xóa, không điều hướng.

![Tra cứu CV ứng viên](images/admin-cv-ung-vien.png)

## 11. Chủ đề CV cũ (`/admin/cv-themes`)

- **Mục đích:** Route tương thích cũ, tự chuyển hướng sang `/admin/cv/themes`.
- **Bố cục:** Không có giao diện (redirect).
- **Thao tác chính:** Không có (tự chuyển trang).

## 12. Banner marketing (`/admin/banner`)

- **Mục đích:** Tạo và quản lý banner ảnh/video hiển thị cho ứng viên.
- **Bố cục:** Tiêu đề; thẻ "Tạo banner mới" (Tiêu đề/Liên kết, Mô tả, chọn file media); thẻ "Banner đã tải" (ảnh/video + nhãn "Đang hiển thị").
- **Thao tác chính:** "Tải và bật banner" (POST FormData); "Bật" (PUT) và "Xóa" (DELETE) từng banner.

![Banner marketing](images/admin-banner.png)

## 13. Rule kiểm duyệt tự động (`/admin/quy-tac-kiem-duyet`)

- **Mục đích:** Quản lý từ khóa cấm và tín hiệu rủi ro để chấm điểm tin tuyển dụng.
- **Bố cục:** Tiêu đề; thẻ form (Từ khóa, Loại rule 1/2, Điểm trừ, Mô tả, checkbox Kích hoạt, nút đóng); thẻ danh sách (ô tìm kiếm, từng dòng: từ khóa + nhãn loại/trạng thái).
- **Thao tác chính:** "Thêm rule", "Lưu rule"/"Hủy", "Sửa"/"Xóa" (hộp xác nhận).

![Rule kiểm duyệt tự động](images/admin-quy-tac-kiem-duyet.png)

## 14. Phân quyền (`/permission-matrix`)

- **Mục đích:** Xem/sửa ma trận quyền Role × Resource (đồng bộ DB và cache `policy.csv`).
- **Bố cục:** Tiêu đề + nhãn "quyền đã thay đổi"; banner chú thích; lưới toolbar (ô tìm resource, chọn/bỏ tất cả theo vai trò) + thân cuộn các checkbox list/show/create/edit/delete; nút "Hủy" (reset) và "Lưu ma trận".
- **Thao tác chính:** Tìm resource, bật/tắt từng ô, "Hủy", "Lưu ma trận" (PUT); mất phiên thì về login.

![Phân quyền](images/permission-matrix.png)

## 15. Quản lý người dùng (`/user-roles`)

- **Mục đích:** Xem danh sách tài khoản và số liệu tổng quan theo vai trò/trạng thái.
- **Bố cục:** Tiêu đề; 3 thẻ thống kê (Tổng người dùng/Đang hoạt động/Quản trị viên); thẻ danh sách (ô tìm kiếm, từng dòng: #id + nhãn vai trò + nhãn Hoạt động/Vô hiệu).
- **Thao tác chính:** Lọc qua ô tìm kiếm; không thêm/sửa/xóa, không điều hướng.

![Quản lý người dùng](images/user-roles.png)

## 16. Hóa đơn (`/invoices`)

- **Mục đích:** Quản lý hóa đơn và thanh toán (placeholder số liệu mẫu).
- **Bố cục:** Tiêu đề; 3 thẻ thống kê mẫu (Tổng/Đã thanh toán/Chờ thanh toán, giá trị "—"); thẻ danh sách chứa trạng thái trống "Chức năng đang được phát triển".
- **Thao tác chính:** Không có (trang tĩnh).

![Hóa đơn](images/invoices.png)
