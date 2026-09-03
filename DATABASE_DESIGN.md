# Thiết kế Database - Smart Recruitment

## 1. Tổng quan hệ thống

Dự án Smart Recruitment là hệ thống tuyển dụng thông minh, tập trung vào các chức năng:

- Quản lý tài khoản người dùng và phân quyền
- Quản lý hồ sơ ứng viên và nhà tuyển dụng
- Quản lý doanh nghiệp và tin tuyển dụng
- Quản lý CV, kỹ năng, kinh nghiệm làm việc
- Theo dõi đơn ứng tuyển, lịch phỏng vấn và kết quả đánh giá
- Hỗ trợ phân tích CV và gợi ý độ phù hợp bằng mô hình đánh giá

Database được xây dựng theo hướng Domain-Driven Design (DDD), tập trung trong thư mục `src/Domain` với các thành phần chính:

- `Common`: base class và audit metadata
- `Entities`: các bảng dữ liệu chính
- `Enums`: trạng thái, loại thông báo, vai trò người dùng
- `Settings`: cấu hình hệ thống như JWT và email

---

## 2. Kiến trúc dữ liệu nền tảng

### 2.1 Base model

#### `BaseEntity`
- `Id`: khóa chính dạng số nguyên
- Dùng cho các entity cơ bản không cần theo dõi thời gian tạo/sửa

#### `AuditableBaseEntity`
- `Id`: khóa chính
- `CreatedBy`: người tạo
- `Created`: thời gian tạo
- `LastModifiedBy`: người sửa gần nhất
- `LastModified`: thời gian sửa gần nhất

Lớp này cho thấy mọi bảng nghiệp vụ đều có khả năng ghi log lịch sử thay đổi, phù hợp cho hệ thống quản trị và audit.

---

### 2.2 Cấu hình hệ thống

#### `JWTSettings`
Là cấu hình cho xác thực token:
- `Key`: secret key
- `Issuer`: đơn vị cấp token
- `Audience`: đối tượng sử dụng token
- `DurationInMinutes`: thời gian hiệu lực token

#### `MailSettings`
Là cấu hình SMTP để gửi email tự động:
- `EmailFrom`: email gửi đi
- `SmtpHost`: host SMTP
- `SmtpPort`: cổng SMTP
- `SmtpUser`: tài khoản SMTP
- `SmtpPass`: mật khẩu SMTP
- `DisplayName`: tên hiển thị trong email

> Những lớp này không phải bảng dữ liệu, mà là cấu hình ứng dụng để kết nối các dịch vụ xác thực và gửi email.

---

## 3. Enum và trạng thái nghiệp vụ

### 3.1 Vai trò người dùng

#### `VaiTroNguoiDung`
- `QUAN_TRI_VIEN = 1`
- `NHA_TUYEN_DUNG = 2`
- `UNG_VIEN = 3`

Mô tả:
- Người quản trị hệ thống
- Người đại diện doanh nghiệp / nhà tuyển dụng
- Ứng viên tìm việc

### 3.2 Trạng thái tin tuyển dụng

#### `TrangThaiTinTuyenDung`
- `HIEN_THI = 1`
- `AN = 2`
- `HET_HAN = 3`

Dùng để quản lý trạng thái hiển thị và hiệu lực của bài đăng việc làm.

### 3.3 Trạng thái đơn ứng tuyển

#### `TrangThaiDonUngTuyen`
- `DA_NOP = 1`
- `DA_DUYET = 2`
- `TU_CHOI = 3`

Dùng để theo dõi kết quả xử lý hồ sơ ứng viên.

### 3.4 Trạng thái lịch phỏng vấn

#### `TrangThaiLichPhongVan`
- `CHO_XAC_NHAN = 1`
- `DA_DONG_Y = 2`
- `HUY = 3`

Hỗ trợ lưu lịch phỏng vấn và quy trình xác nhận từ nhà tuyển dụng / ứng viên.

### 3.5 Loại thông báo

#### `LoaiThongBao`
- `VIEC_LAM_MOI = 1`
- `LICH_PHONG_VAN = 2`
- `DON_UNG_TUYEN = 3`

Dùng cho hệ thống thông báo push / hiển thị trên web/mobile.

### 3.6 Phân loại độ phù hợp

#### `PhanLoaiKetQua`
- `Cao = 1`
- `Trung_Binh = 2`
- `Thap = 3`

Dùng trong đánh giá mức độ phù hợp giữa ứng viên và bài đăng tuyển dụng.

---

## 4. Danh sách thực thể (bảng dữ liệu)

Tổng cộng có 17 entity chính trong Domain:

1. `nguoiDung`
2. `hoSoUngVien`
3. `hoSoNhaTuyenDung`
4. `doanhNghiep`
5. `tinTuyenDung`
6. `danhMucNghe`
7. `kyNang`
8. `kyNangUngVien`
9. `kyNangTinTuyenDung`
10. `cvUngVien`
11. `ketQuaPhanTichCv`
12. `donUngTuyen`
13. `lichPhongVan`
14. `ketQuaPhuHop`
15. `kinhNghiemLamViec`
16. `thongBao`
17. `danhGia`

---

## 5. Chi tiết từng bảng

### 5.1 `nguoiDung`

Mục đích:
- Quản lý tài khoản hệ thống, phân quyền và trạng thái kích hoạt

Các trường:
- `ApplicationUserId`: khóa liên kết với Identity user của ASP.NET
- `vaiTro`: vai trò người dùng (`VaiTroNguoiDung`)
- `Is_Active`: trạng thái hoạt động (mặc định `true`)
- Kế thừa `AuditableBaseEntity`

Quan hệ:
- 1-1 với `hoSoUngVien`
- 1-1 với `hoSoNhaTuyenDung`
- 1-nhiều với `thongBao`

---

### 5.2 `hoSoUngVien`

Mục đích:
- Lưu hồ sơ cá nhân của ứng viên

Các trường:
- `nguoiDungId`: người dùng tương ứng
- `hoTen`: họ tên
- `SDT`: số điện thoại
- `ngaySinh`: ngày sinh
- `gioiTinh`: giới tính
- `diaChi`: địa chỉ
- `gioiThieu`: giới thiệu bản thân

Quan hệ:
- Nhiều-1 với `nguoiDung`
- 1-nhiều với `kyNangUngVien`
- 1-nhiều với `cvUngVien`
- 1-nhiều với `donUngTuyen`
- 1-nhiều với `kinhNghiemLamViec`
- 1-nhiều với `ketQuaPhuHop`

---

### 5.3 `hoSoNhaTuyenDung`

Mục đích:
- Lưu thông tin người đại diện doanh nghiệp tuyển dụng

Các trường:
- `nguoiDungId`: tài khoản hệ thống
- `doanhNghiepId`: doanh nghiệp mà người này đại diện
- `hoTen`: họ tên người đại diện
- `SDT`: số điện thoại
- `chucVu`: chức vụ

Quan hệ:
- Nhiều-1 với `nguoiDung`
- Nhiều-1 với `doanhNghiep`

---

### 5.4 `doanhNghiep`

Mục đích:
- Lưu thông tin công ty/doanh nghiệp tuyển dụng

Các trường:
- `tenDoanhNghiep`: tên công ty
- `moTa`: mô tả doanh nghiệp
- `website`: website
- `diaChi`: địa chỉ
- `logoUrl`: đường dẫn logo
- `maSoThue`: mã số thuế
- `linhVucHoatDong`: lĩnh vực hoạt động
- `quyMoNhanSu`: quy mô nhân sự
- `nguoiDaiDien`: người đại diện

Quan hệ:
- 1-nhiều với `hoSoNhaTuyenDung`
- 1-nhiều với `tinTuyenDung`

---

### 5.5 `danhMucNghe`

Mục đích:
- Danh mục ngành nghề dùng để phân loại và tìm kiếm công việc

Các trường:
- `tenNghe`: tên ngành nghề
- `moTa`: mô tả ngành nghề

Quan hệ:
- 1-nhiều với `tinTuyenDung`

---

### 5.6 `tinTuyenDung`

Mục đích:
- Lưu thông tin một tin tuyển dụng

Các trường:
- `doanhNghiepId`: công ty đăng bài
- `danhMucNgheId`: ngành nghề liên quan
- `tieuDe`: tiêu đề bài đăng
- `moTaCongViec`: mô tả công việc
- `kinhNghiemYeuCau`: yêu cầu kinh nghiệm
- `yeuCauCongViec`: yêu cầu công việc
- `quyenLoi`: quyền lợi
- `diaDiemLamViec`: địa điểm làm việc
- `luongToiThieu`: mức lương tối thiểu
- `luongToiDa`: mức lương tối đa
- `trangThai`: trạng thái tin (`TrangThaiTinTuyenDung`)
- `ngayHetHan`: ngày hết hạn

Quan hệ:
- Nhiều-1 với `doanhNghiep`
- Nhiều-1 với `danhMucNghe`
- 1-nhiều với `kyNangTinTuyenDung`
- 1-nhiều với `donUngTuyen`
- 1-nhiều với `ketQuaPhuHop`

---

### 5.7 `kyNang`

Mục đích:
- Danh mục kỹ năng chuẩn hóa dùng chung cho ứng viên và tin tuyển dụng

Các trường:
- `tenKyNang`: tên kỹ năng
- `moTa`: mô tả kỹ năng

Quan hệ:
- 1-nhiều với `kyNangUngVien`
- 1-nhiều với `kyNangTinTuyenDung`

---

### 5.8 `kyNangUngVien`

Mục đích:
- Cho biết ứng viên có kỹ năng nào và mức độ/kinh nghiệm tương ứng

Các trường:
- `hoSoUngVienId`: ứng viên
- `kyNangId`: kỹ năng
- `soNamKinhNghiem`: số năm kinh nghiệm

Quan hệ:
- Nhiều-1 với `hoSoUngVien`
- Nhiều-1 với `kyNang`

> Đây là bảng nối giữa ứng viên và kỹ năng.

---

### 5.9 `kyNangTinTuyenDung`

Mục đích:
- Mô tả kỹ năng yêu cầu của một tin tuyển dụng

Các trường:
- `tinTuyenDungId`: tin tuyển dụng
- `kyNangId`: kỹ năng
- `mucDoYeuCau`: mức độ yêu cầu

Quan hệ:
- Nhiều-1 với `tinTuyenDung`
- Nhiều-1 với `kyNang`

> Đây là bảng nối giữa tin tuyển dụng và kỹ năng cần có.

---

### 5.10 `cvUngVien`

Mục đích:
- Lưu file CV của ứng viên và trạng thái CV mặc định

Các trường:
- `hoSoUngVienId`: ứng viên sở hữu CV
- `tenFile`: tên file CV
- `fileUrl`: đường dẫn lưu file
- `ngayUpload`: ngày upload
- `is_Default`: CV mặc định (mặc định `true`)

Quan hệ:
- Nhiều-1 với `hoSoUngVien`
- 1-nhiều với `ketQuaPhanTichCv`
- 1-nhiều với `donUngTuyen` (do `donUngTuyen` có `cvUngVienId`)

---

### 5.11 `ketQuaPhanTichCv`

Mục đích:
- Lưu kết quả phân tích CV bằng NLP / trích xuất thông tin từ CV

Các trường:
- `cvUngVienId`: CV được phân tích
- `noiDungTrichXuat`: nội dung trích xuất
- `kyNangTrichXuat`: kỹ năng trích xuất
- `kinhNghiemTrichXuat`: kinh nghiệm trích xuất
- `ngayPhanTich`: ngày phân tích

Quan hệ:
- Nhiều-1 với `cvUngVien`

---

### 5.12 `donUngTuyen`

Mục đích:
- Ghi nhận ứng viên nộp hồ sơ cho một tin tuyển dụng

Các trường:
- `hoSoUngVienId`: ứng viên
- `tinTuyenDungId`: tin tuyển dụng
- `cvUngVienId`: CV ứng tuyển
- `trangThai`: trạng thái đơn (`TrangThaiDonUngTuyen`)
- `ngayUngTuyen`: ngày ứng tuyển

Quan hệ:
- Nhiều-1 với `hoSoUngVien`
- Nhiều-1 với `tinTuyenDung`
- Nhiều-1 với `cvUngVien`
- 1-nhiều với `lichPhongVan`

---

### 5.13 `lichPhongVan`

Mục đích:
- Lưu lịch phỏng vấn giữa nhà tuyển dụng và ứng viên

Các trường:
- `donUngTuyenId`: đơn ứng tuyển tương ứng
- `diaDiem`: địa điểm phỏng vấn
- `ghiChu`: ghi chú
- `thoiGianPhongVan`: thời gian hoạt động phỏng vấn
- `trangThai`: trạng thái lịch hẹn

Quan hệ:
- Nhiều-1 với `donUngTuyen`

---

### 5.14 `ketQuaPhuHop`

Mục đích:
- Đánh giá mức độ phù hợp giữa ứng viên và tin tuyển dụng

Các trường:
- `hoSoUngVienId`: ứng viên
- `tinTuyenDungId`: tin tuyển dụng
- `diemPhuHop`: điểm phù hợp
- `phanLoai`: phân loại mức độ phù hợp (`PhanLoaiKetQua`)
- `ngayDanhGia`: ngày đánh giá

Quan hệ:
- Nhiều-1 với `hoSoUngVien`
- Nhiều-1 với `tinTuyenDung`

> Đây là bảng quan trọng cho hệ thống gợi ý / matching CV-job.

---

### 5.15 `kinhNghiemLamViec`

Mục đích:
- Lưu lịch sử công tác / kinh nghiệm làm việc của ứng viên

Các trường:
- `hoSoUngVienId`: ứng viên
- `tenCongTy`: tên công ty
- `diaChi`: địa chỉ công ty
- `tuNgay`: ngày bắt đầu
- `denNgay`: ngày kết thúc
- `moTa`: mô tả công việc
- `IsHienTai`: công việc hiện tại hay không

Quan hệ:
- Nhiều-1 với `hoSoUngVien`

---

### 5.16 `thongBao`

Mục đích:
- Lưu các thông báo gửi tới người dùng

Các trường:
- `nguoiDungId`: người nhận thông báo
- `tieuDe`: tiêu đề
- `noiDung`: nội dung
- `loaiThongBao`: loại thông báo
- `Is_Read`: thông báo đã đọc chưa

Quan hệ:
- Nhiều-1 với `nguoiDung`

---

### 5.17 `danhGia`

Mục đích:
- Lưu phản hồi / đánh giá sau quá trình ứng tuyển hoặc phỏng vấn

Các trường:
- `donUngTuyenId`: đơn ứng tuyển liên quan
- `noiDungPhanHoi`: nội dung phản hồi
- `ketLuan`: kết luận đánh giá
- `ngayPhanHoi`: ngày phản hồi

> Bảng này hiện đang có cấu trúc tương đối đơn giản, chưa thấy đầy đủ navigation property và quan hệ trực tiếp như các entity khác.

---

## 6. Mô hình quan hệ dữ liệu tổng hợp

### 6.1 Quan hệ chính

- `nguoiDung` -> `hoSoUngVien` : 1-1
- `nguoiDung` -> `hoSoNhaTuyenDung` : 1-1
- `nguoiDung` -> `thongBao` : 1-nhiều
- `doanhNghiep` -> `hoSoNhaTuyenDung` : 1-nhiều
- `doanhNghiep` -> `tinTuyenDung` : 1-nhiều
- `danhMucNghe` -> `tinTuyenDung` : 1-nhiều
- `hoSoUngVien` -> `donUngTuyen` : 1-nhiều
- `tinTuyenDung` -> `donUngTuyen` : 1-nhiều
- `donUngTuyen` -> `lichPhongVan` : 1-nhiều
- `hoSoUngVien` -> `cvUngVien` : 1-nhiều
- `cvUngVien` -> `ketQuaPhanTichCv` : 1-nhiều
- `hoSoUngVien` -> `kyNangUngVien` : 1-nhiều
- `kyNang` -> `kyNangUngVien` : 1-nhiều
- `tinTuyenDung` -> `kyNangTinTuyenDung` : 1-nhiều
- `kyNang` -> `kyNangTinTuyenDung` : 1-nhiều
- `hoSoUngVien` -> `ketQuaPhuHop` : 1-nhiều
- `tinTuyenDung` -> `ketQuaPhuHop` : 1-nhiều
- `hoSoUngVien` -> `kinhNghiemLamViec` : 1-nhiều

### 6.2 Quan hệ many-to-many

Hệ thống sử dụng bảng trung gian để thực hiện nhiều-nhiều:

- `hoSoUngVien` - `kyNang` qua `kyNangUngVien`
- `tinTuyenDung` - `kyNang` qua `kyNangTinTuyenDung`

---

## 7. Luồng nghiệp vụ chính trong database

### 7.1 Quy trình ứng viên

1. `nguoiDung` đăng ký tài khoản
2. Tạo `hoSoUngVien`
3. Thêm `kyNangUngVien`, `kinhNghiemLamViec`, `cvUngVien`
4. Upload CV, hệ thống lưu `ketQuaPhanTichCv`
5. Ứng viên nộp đơn qua `donUngTuyen`
6. Hệ thống đánh giá phù hợp và ghi vào `ketQuaPhuHop`
7. Nếu có phỏng vấn thì tạo `lichPhongVan`

### 7.2 Quy trình nhà tuyển dụng

1. `nguoiDung` với vai trò `NHA_TUYEN_DUNG` quản lý hoặc thuộc doanh nghiệp
2. `doanhNghiep` được tạo / cập nhật
3. Tạo `tinTuyenDung`
4. Chọn kỹ năng yêu cầu bằng `kyNangTinTuyenDung`
5. Xem đơn ứng tuyển trong `donUngTuyen`
6. Gửi phản hồi, xác nhận phỏng vấn hoặc từ chối
7. Gửi `thongBao` tới ứng viên / quản trị viên

---

## 8. Đặc điểm thiết kế đáng chú ý

- Database theo hướng nghiệp vụ rõ ràng, có các bảng trung gian cho mối quan hệ many-to-many.
- Mọi entity đều kế thừa `AuditableBaseEntity`, giúp ghi nhật ký thời gian và người thao tác.
- Hệ thống có tính mở cho AI/ML vì có bảng `ketQuaPhanTichCv` và `ketQuaPhuHop`.
- Có cấu hình JWT và SMTP đủ để vận hành hệ thống xác thực và gửi email.
- `danhGia` đang chưa có navigation property rõ ràng, nên cần kiểm tra lại nếu muốn chuẩn hóa hoàn chỉnh.

---

## 9. Kết luận

Database của Smart Recruitment bao gồm các chủ thể chính:

- Người dùng
- Ứng viên
- Nhà tuyển dụng
- Doanh nghiệp
- Tin tuyển dụng
- CV và kỹ năng
- Đơn ứng tuyển
- Phỏng vấn
- Thông báo
- Đánh giá độ phù hợp và phân tích CV

Nhìn tổng thể, schema này phù hợp với mô hình tuyển dụng online hiện đại, có thể mở rộng cho chức năng gợi ý việc làm, trích xuất CV và quản lý đơn tuyển dụng theo quy trình thực tế.
