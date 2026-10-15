# Mô tả giao diện — Tuyến Ứng viên

> Quy ước: mỗi màn hình gồm mục đích, bố cục, thao tác chính và ô ảnh minh họa.
> Ảnh chụp màn hình đặt tại `docs/ui/images/`, đặt tên đúng như ghi dưới mỗi mục.

## 1. Tìm việc làm (`/viec-lam`)

- **Mục đích:** Tìm kiếm, lọc và duyệt danh sách tin tuyển dụng đang mở.
- **Bố cục:** Header (tiêu đề "Tìm Việc Làm", nút "Việc đã lưu"); khối gợi ý (3 tin); thanh lọc (ô tìm kiếm, nút "Tìm việc", pills Địa điểm/Cấp bậc/Hình thức/Cách thức/Mức lương, nút "Lọc nâng cao" mở panel trượt với thanh trượt lương + kỹ năng gợi ý + lưới địa điểm, nút "Xóa lọc", dòng "Tìm thấy X việc làm"); lưới thẻ tin (JobCard) kèm skeleton/empty-state; phân trang; panel xem nhanh (logo, tiêu đề, công ty, nhãn lương/cấp bậc/hình thức, Mô tả, Kỹ năng).
- **Thao tác chính:** Nhập từ khóa/bộ lọc → danh sách tải lại; bấm bookmark lưu tin; bấm thẻ tin → chi tiết `/viec-lam/[id]`; trong panel xem nhanh bấm "Xem chi tiết và ứng tuyển".

![Tìm việc làm](images/viec-lam.png)

## 2. Chi tiết việc làm (`/viec-lam/[id]`)

- **Mục đích:** Xem chi tiết một tin tuyển dụng và nộp đơn bằng CV đã có.
- **Bố cục:** Link "Về tìm việc làm"; thẻ đầu trang (tiêu đề tin, tên doanh nghiệp, chips lương/địa điểm/hình thức/Hạn nộp/Số ứng viên, nhãn trình độ/loại hình/danh sách kỹ năng); dải nút hành động; cột chính (Mô tả công việc, Yêu cầu công việc, Kinh nghiệm yêu cầu, Quyền lợi); cột phải (Tổng quan: lương/địa điểm/phương thức/hạn nộp/ứng viên; Kỹ năng cần có; Doanh nghiệp); hộp thoại "Chọn CV để ứng tuyển" (danh sách CV: tên file, vị trí, nhãn "Mặc định", nút xem trước tóm tắt).
- **Thao tác chính:** "Ứng tuyển ngay" → chọn CV → "Xác nhận nộp đơn"; chưa có CV thì "Tạo CV ngay" → `/tao-cv`; "Xem việc đã ứng tuyển" → `/viec-lam/da-ung-tuyen`.

![Chi tiết việc làm](images/viec-lam-id.png)

## 3. Việc làm phù hợp (`/viec-lam/phu-hop`)

- **Mục đích:** Xem gợi ý việc làm theo điểm phù hợp AI.
- **Bố cục:** Tiêu đề "Việc làm phù hợp"; 3 ô thống kê (Tổng gợi ý/Phù hợp cao/Từ 50% trở lên) + link "Tìm thêm việc"; 2 dropdown (mức độ: Tất cả/Cao từ 66%/Trung bình 50–65%/Thấp; sắp xếp: Điểm cao nhất/Tên công việc); danh sách từng dòng (tiêu đề + nhãn "% match", công ty · địa điểm · lương, chips "Khớp: kỹ năng"/"Thiếu: ...").
- **Thao tác chính:** Đổi dropdown mức độ/sắp xếp để lọc; "Xem & ứng tuyển" → `/viec-lam/[id]`; "Tìm thêm việc" → `/viec-lam`.

![Việc làm phù hợp](images/viec-lam-phu-hop.png)

## 4. Tạo CV thủ công (`/tao-cv`)

- **Mục đích:** Soạn CV thủ công 6 mục với xem trước A4 theo thời gian thực, lưu phiên bản và xuất PDF.
- **Bố cục:** Thanh trên (breadcrumb Tạo/Chỉnh sửa CV, trạng thái Nháp/Đang lưu/Đã lưu, nút "Lưu CV", "Xuất PDF", menu "Thao tác", nút "Bố cục"); dải "CV của tôi" (chọn CV, ô "Tên file") + dải "Lịch sử" (các nút "Bản N"); thẻ "Chất lượng CV" (% tiến độ) + banner khôi phục nháp; cột trái (checklist 6 mục, chọn mẫu, form: Thông tin liên hệ, Kinh nghiệm, Học vấn, Kỹ năng, Dự án, Chứng chỉ); cột phải xem trước dính (zoom ±, Fit/100%, toàn màn hình, Xuất PDF/Lưu nháp + bản A4); mobile dùng Tabs "Nhập liệu"/"Xem trước".
- **Thao tác chính:** Chọn CV (`?cv=`), "CV mới", "Đổ từ hồ sơ", "Tải CV lên", đổi mẫu giữ nội dung (`?template=`), "Lưu CV" tạo phiên bản, "Xuất PDF", "Đặt mặc định".

![Tạo CV thủ công](images/tao-cv.png)

## 5. Thư viện mẫu CV (`/mau-cv`)

- **Mục đích:** Duyệt thư viện mẫu, xem trước với dữ liệu mẫu rồi chọn mẫu để tạo CV.
- **Bố cục:** Nhãn "Mẫu CV" + tiêu đề "Chọn mẫu cho CV của bạn"; thẻ lọc (ô tìm theo tên/slug/thẻ, dropdown ATS/Bố cục/Sắp xếp, pills nhóm, đếm "x–y / N mẫu"); lưới thẻ mẫu 12/trang (bản A4 thu nhỏ, hover hiện "Xem trước"/"Dùng mẫu này", tên + nhãn MỚI/ATS/nhóm); phân trang; hộp thoại xem trước (tên, mô tả, tags, bản full).
- **Thao tác chính:** Tìm/lọc/sắp xếp/đổi trang; "Xem trước" mở hộp thoại; "Dùng mẫu này" → `/tao-cv?template=<id>` (giữ `&cv=` nếu đang sửa CV).

![Thư viện mẫu CV](images/mau-cv.png)

## 6. Studio CV AI (`/CV`)

- **Mục đích:** Tạo và chỉnh CV bằng hội thoại với trợ lý AI Adam, xem trước cập nhật realtime.
- **Bố cục:** Thanh trên (tên "AI CV STUDIO", trạng thái lưu, nút "CV mới"/"Lưu CV"); 2 cột: trái là khung chat (lời chào, gợi ý nhanh: Tạo CV từ đầu/Cải thiện nội dung/Tối ưu theo JD/Kiểm tra ATS); phải là thẻ xem trước (chọn mẫu, zoom 80–120%, nút PDF, bản CV, tên mẫu).
- **Thao tác chính:** Chat/gợi ý để AI điền CV realtime; đổi mẫu; zoom; xuất PDF; "Lưu CV" hoặc "CV mới" làm lại.

![Studio CV AI](images/cv-ai.png)

## 7. Hồ sơ ứng viên (`/ho-so`)

- **Mục đích:** Quản lý thông tin cá nhân, định hướng nghề nghiệp và danh sách CV đã tạo.
- **Bố cục:** Tiêu đề + nút "Chỉnh sửa hồ sơ"/"Tạo CV từ hồ sơ"/"Thử lại"; chế độ xem: thẻ chính (avatar, họ tên, vị trí, nhãn "Đang tìm việc", email/SĐT/ngày sinh/địa chỉ/lương) + thẻ "Giới thiệu bản thân & Mục tiêu"; thẻ "CV của tôi" (nút "Tạo CV", từng dòng: tên file + nhãn "Mặc định" + mẫu + ngày cập nhật); form sửa 2 nhóm (Thông tin cá nhân: ảnh đại diện, họ tên, SĐT, ngày sinh, giới tính, địa chỉ; Định hướng: vị trí, lương, checkbox tìm việc, giới thiệu) + "Hủy bỏ"/"Lưu hồ sơ".
- **Thao tác chính:** "Chỉnh sửa/Lưu/Hủy" hồ sơ; "Tạo CV (từ hồ sơ)" → `/tao-cv`; trên mỗi CV: "Đặt làm mặc định", "Mở/Sửa" → `/tao-cv?cv=<id>`, "Phân tích AI", "In/PDF".

![Hồ sơ ứng viên](images/ho-so.png)

## 8. Hộp thư ứng viên (`/ung-vien`)

- **Mục đích:** Nhà tuyển dụng mở hồ sơ, duyệt phù hợp hoặc từ chối các đơn ứng tuyển.
- **Bố cục:** Tiêu đề "Hộp thư ứng viên"; thẻ "Đơn ứng tuyển" (mô tả số lượng, dropdown trạng thái, ô tìm kiếm); danh sách từng dòng (avatar, họ tên/"Hồ sơ #", nhãn trạng thái, tiêu đề tin, vị trí · Đơn # · ngày nộp, ghi chú).
- **Thao tác chính:** Lọc trạng thái + tìm kiếm; "Xem CV" (tự đánh dấu đã xem nếu đơn chờ xử lý); "Duyệt phù hợp" hoặc "Từ chối" (nhập lý do) qua hộp xác nhận.

![Hộp thư ứng viên](images/ung-vien.png)

## 9. Đăng nhập (`/login`)

- **Mục đích:** Đăng nhập cổng ứng viên bằng mật khẩu, Google hoặc Magic Link.
- **Bố cục:** 2 cột; trái (thương hiệu HIREAI, tiêu đề chào mừng, 3 số liệu, thẻ "Cổng ứng viên", link "Tạo CV miễn phí"); phải (tabs "Email & mật khẩu/Magic Link", form mật khẩu: email + mật khẩu + "Quên mật khẩu?" + ghi nhớ đăng nhập + nút tiếp tục + nút Google; form magic: nút "Gửi Magic Link qua Email"; chân trang "Đăng ký tài khoản mới").
- **Thao tác chính:** Đăng nhập → chuyển tiếp `?next=`; "Quên mật khẩu?" → `/forgot-password`; "Đăng ký tài khoản mới" → `/register`.

![Đăng nhập](images/login.png)

## 10. Đăng ký ứng viên (`/register`)

- **Mục đích:** Tạo tài khoản ứng viên (vai trò UNG_VIEN cố định).
- **Bố cục:** Như trang đăng nhập (2 cột, panel trái Talent Network); phải: tabs Email-mật khẩu (Họ tên, SĐT, Email, Mật khẩu, Xác nhận) / Magic Link (Họ tên, Email, SĐT) + nút Google, links Điều khoản/Bảo mật, chân "Đăng nhập ngay". Chế độ lời mời (`?inviteToken`): email chỉ đọc, ẩn tabs/social.
- **Thao tác chính:** "Tạo tài khoản ứng viên" / "Nhận liên kết kích hoạt"; "Đăng nhập ngay" → `/login`.

![Đăng ký ứng viên](images/register.png)

## 11. Việc đã ứng tuyển (`/viec-lam/da-ung-tuyen`)

- **Mục đích:** Theo dõi trạng thái các đơn ứng tuyển đã gửi.
- **Bố cục:** Tiêu đề (icon Send); dropdown lọc trạng thái (10 trạng thái 0–9); thẻ danh sách đơn (mỗi dòng: nhãn trạng thái, link tiêu đề tin, tên doanh nghiệp, ngày nộp, lương + địa điểm, ghi chú, dòng "Kết quả từ NTD"); phân trang.
- **Thao tác chính:** Lọc trạng thái (reset về trang 1); "Xem tin" → `/viec-lam/{id}`; "Rút đơn" (chỉ khi trạng thái cho phép, có xác nhận); Trước/Sau chuyển trang.

![Việc đã ứng tuyển](images/viec-lam-da-ung-tuyen.png)

## 12. Việc đã lưu (`/viec-lam/da-luu`)

- **Mục đích:** Xem lại các tin đã bookmark để ứng tuyển sau.
- **Bố cục:** Tiêu đề (icon Bookmark + đếm số tin); lưới thẻ tin đã lưu; skeleton khi tải; empty-state nét đứt khi trống.
- **Thao tác chính:** "Tìm việc làm"/"Khám phá việc làm" → `/viec-lam`; "Thử lại" khi lỗi; bấm bookmark trên thẻ để bỏ lưu.

![Việc đã lưu](images/viec-lam-da-luu.png)

## 13. Việc làm theo vị trí (`/viec-lam/theo-vi-tri`)

- **Mục đích:** Trang sắp ra mắt duyệt việc theo nhóm vị trí IT.
- **Bố cục:** Khối ComingSoon "Việc làm theo vị trí đang phát triển".
- **Thao tác chính:** "Về tìm việc làm" → `/viec-lam`.

![Việc làm theo vị trí](images/viec-lam-theo-vi-tri.png)

## 14. Khám phá doanh nghiệp (`/doanh-nghiep`)

- **Mục đích:** Tìm và duyệt danh bạ doanh nghiệp đang tuyển.
- **Bố cục:** Hero "Danh bạ tuyển dụng" (ô tìm kiếm + lọc lĩnh vực/địa chỉ); khối "Doanh nghiệp nổi bật" (3 thẻ + skeleton); khối "Tất cả doanh nghiệp" (danh sách + phân trang 8/trang).
- **Thao tác chính:** Tìm kiếm (gõ trễ), lọc, "Theo dõi"/"Bỏ theo dõi", chuyển trang, "Thử lại" khi lỗi.

![Khám phá doanh nghiệp](images/doanh-nghiep.png)

## 15. Chi tiết doanh nghiệp (`/doanh-nghiep/[id]`)

- **Mục đích:** Xem hồ sơ một doanh nghiệp và các tin đang tuyển.
- **Bố cục:** Link về danh sách; đầu trang công ty (nút Theo dõi); cột chính (Giới thiệu + Việc gợi ý + Việc đang tuyển kèm điểm phù hợp); cột phụ thông tin công ty; skeleton/lỗi + "Thử lại".
- **Thao tác chính:** "Về danh sách doanh nghiệp"; "Theo dõi"; bấm tin để xem chi tiết.

![Chi tiết doanh nghiệp](images/doanh-nghiep-id.png)

## 16. Top doanh nghiệp (`/doanh-nghiep/top`)

- **Mục đích:** Trang sắp ra mắt bảng xếp hạng doanh nghiệp nổi bật.
- **Bố cục:** Khối ComingSoon "Top doanh nghiệp đang phát triển".
- **Thao tác chính:** "Về tìm công ty" → `/doanh-nghiep`.

![Top doanh nghiệp](images/doanh-nghiep-top.png)

## 17. Công ty đang theo dõi (`/doanh-nghiep/dang-theo-doi`)

- **Mục đích:** Xem các công ty ứng viên đã nhấn theo dõi.
- **Bố cục:** Tiêu đề (icon chuông + đếm số công ty); lưới thẻ công ty đã lọc; empty-state "Chưa theo dõi công ty nào"; loading/lỗi tải danh bạ.
- **Thao tác chính:** "Theo dõi"/"Bỏ theo dõi" trên từng thẻ; "Khám phá công ty" → `/doanh-nghiep`; "Thử lại" khi lỗi.

![Công ty đang theo dõi](images/doanh-nghiep-dang-theo-doi.png)

## 18. Import CV (`/CV/import`)

- **Mục đích:** Mở trình soạn CV kèm hộp thoại nhập CV có sẵn (file/JSON).
- **Bố cục:** Giống hệt `/tao-cv` (render chung `TaoCvView`: topbar, dải CV, checklist, form, preview) + hộp `CvImportDialog` mở sẵn.
- **Thao tác chính:** Như `/tao-cv`; thêm nhập CV từ file trong hộp thoại.

![Import CV](images/cv-import.png)

## 19. Phân tích CV (`/cv-phan-tich/[cvId]`)

- **Mục đích:** Xem kết quả AI trích xuất/tóm tắt một CV.
- **Bố cục:** Link về hồ sơ; hero "Phân tích CV bằng AI — CV #id"; 4 mục (Tóm tắt, Kỹ năng trích xuất, Kinh nghiệm trích xuất, Học vấn trích xuất); cảnh báo khi phân tích chưa xong; thẻ gợi ý đối chiếu; trạng thái tải/trống.
- **Thao tác chính:** "Về hồ sơ của tôi" → `/ho-so`; chưa có kết quả thì "Mở CV để lưu" → `/tao-cv?cv=<id>`; link "Việc phù hợp" → `/viec-lam/phu-hop`.

![Phân tích CV](images/cv-phan-tich.png)

## 20. Quản lý kỹ năng (`/ky-nang`)

- **Mục đích:** CRUD danh mục kỹ năng dùng chung của hệ thống.
- **Bố cục:** Tiêu đề (icon Tags) + nút "Thêm kỹ năng"; form thêm/sửa (Tên kỹ năng + Mô tả, Hủy/Lưu); thẻ bảng (ID/Tên/Mô tả/Thao tác) + ô tìm kiếm; trạng thái tải/trống.
- **Thao tác chính:** "Thêm kỹ năng" (POST), "Sửa" (PUT), "Xóa" (hộp xác nhận, DELETE); tìm kiếm theo tên/mô tả.

![Quản lý kỹ năng](images/ky-nang.png)

## 21. Kỹ năng của tôi (`/ky-nang-ung-vien`)

- **Mục đích:** Gắn kỹ năng từ từ điển vào hồ sơ kèm số năm kinh nghiệm.
- **Bố cục:** Tiêu đề (icon Zap) + nút "Thêm kỹ năng"; form (dropdown kỹ năng — khóa khi sửa — + ô số năm); danh sách từng dòng (tên, "X năm kinh nghiệm"/"Chưa có số năm", mô tả) + ô tìm kiếm.
- **Thao tác chính:** "Thêm kỹ năng" (chặn trùng); "Sửa" số năm; xóa (xác nhận trình duyệt).

![Kỹ năng của tôi](images/ky-nang-ung-vien.png)

## 22. Kinh nghiệm làm việc (`/kinh-nghiem`)

- **Mục đích:** Quản lý lịch sử kinh nghiệm trong hồ sơ ứng viên.
- **Bố cục:** Tiêu đề (icon Briefcase) + nút "Thêm kinh nghiệm"; form (tên công ty/địa chỉ/từ ngày/đến ngày, checkbox "Đang làm tại đây" khóa ngày kết thúc, mô tả); danh sách (tên công ty, địa chỉ, "MM/YYYY — Hiện tại", mô tả cắt 2 dòng).
- **Thao tác chính:** "Thêm kinh nghiệm" (POST); "Sửa" đổ dữ liệu vào form (PUT); "Xóa" (DELETE, xác nhận).

![Kinh nghiệm làm việc](images/kinh-nghiem.png)
