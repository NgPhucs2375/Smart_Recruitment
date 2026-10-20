# Tổng quan bảo mật — Hệ thống Smart Recruitment

> Tài liệu tóm tắt công tác rà soát và gia cố bảo mật phía Frontend (hoàn thành),
> kèm các tồn đọng phía Backend đã bàn giao. Dành cho giảng viên hướng dẫn.

## 1. Mục tiêu và phạm vi

Đồ án xử lý dữ liệu nhạy cảm (hồ sơ ứng viên, CV, tài khoản), nên nhóm đã audit
3 mũi trước khi hoàn thiện: (1) XSS/injection toàn bộ chỗ nhập liệu,
(2) luồng xác thực và dữ liệu phía trình duyệt, (3) bề mặt backend (C#).
Nguyên tắc xuyên suốt: **validation phía trình duyệt chỉ phục vụ trải nghiệm
người dùng, tuyến phòng thủ cuối cùng luôn nằm ở server.**

## 2. Chống XSS và injection (đã hoàn thành, phía FE)

**Kết quả rà soát:** toàn bộ mã nguồn frontend không có sink thực thi mã nào:
không `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `iframe` nguồn ngoài hay
`postMessage` thiếu kiểm tra origin. Mọi chữ người dùng render qua React
(tự escape), mọi điều hướng dùng URL cố định hoặc `encodeURIComponent`.

**Biện pháp đã triển khai:**
- Module validators trung tâm `src/WebApi/frontend/features/tao-cv/validation.ts`:
  email (định dạng + TLD), SĐT di động VN (`0[35789]xxxxxxxx`), URL/http,
  `safeHref` chặn `javascript:/data:/vbscript:` kể cả ngụy trang ký tự vô hình,
  màu hex, ngày sinh không tương lai — dùng chung 1 nguồn cho mọi form.
- Chặn cứng trước khi gửi (save-gate) + báo đỏ inline khi gõ ở form tạo CV,
  form đăng nhập/đăng ký (2 cổng), mời nhân sự, hồ sơ doanh nghiệp.
- 100% thẻ `<a href>` từ dữ liệu người dùng (36+ mẫu CV, ThemeCanvas, banner,
  website công ty) đi qua `safeHref`; link nguy hiểm render thành text thường.
- Upload ảnh kiểm tra MIME + 5MB phía client (avatar, preview theme).
- Redirect `?next=`/`returnTo` qua allowlist, chặn `//evil.com`.

**Kiểm thử:** `tsc --noEmit` 0 lỗi; 31 case validators + 9 case auth chạy xanh
bằng Node (email rác, SĐT sai đầu số, URL `javascript:`, màu lạ, file quá cỡ).

## 3. Xác thực và chống brute-force

**Phía trình duyệt (đã xong):** đếm sai liên tiếp theo email (chỉ số lượng +
mốc giờ), khóa nút tăng dần sai 3 lần chờ 10s, 5 lần chờ 30s, 7 lần trở lên
chờ 60s, tự mở lại và reset khi đăng nhập thành công (áp dụng cả 2 cổng);
thông báo phân biệt tài khoản bị khóa / bị giới hạn tốc độ / sai thường.
Mật khẩu giữ `min(6)` tương thích backend + `max(100)`; token JWT chỉ giữ ở
bộ nhớ và storage trình duyệt, đã dọn các log lộ token ra console.

**Phía server (có sẵn + còn mở):** ASP.NET Identity đã đếm sai và khóa tài
khoản theo mặc định framework; các endpoint cập nhật dùng DTO whitelist,
IDOR có kiểm tra sở hữu, CORS không wildcard, EF không SQL thô. Còn mở:
rate-limit theo IP cho cụm auth, CAPTCHA (đã thống nhất tạm bỏ), thống nhất
mã khóa về 403, audit log đăng nhập sai, xác minh `state` OAuth GitHub.

## 4. Tồn đọng và chủ sở hữu

| # | Việc | Mức độ | Trạng thái |
|---|---|---|---|
| 1 | Rate-limit IP cho endpoints auth (10 req/phút + 429) | Cao | Chờ BE |
| 2 | Xoay secrets trong `appsettings.Development.json` (JWT, AI keys, Google, MinIO) vì repo đã public | Cao | Chờ BE/quản trị |
| 3 | `Seed:EnableDefaultUsers=false` ở production | Cao | Chờ BE |
| 4 | Verify `state` GitHub OAuth (CSRF) | Cao | Chờ BE |
| 5 | Thống nhất mã khóa tài khoản 403 + `RequireHttpsMetadata=true` khi có domain | Trung bình | Chờ BE |
| 6 | Anti-enumeration đồng nhất forgot/reset-password | Trung bình | Chờ BE |
| 7 | Magic-byte check file upload phía server | Trung bình | Chờ BE |

## 5. Danh mục kiểm thử lại

```bash
# Frontend (yêu cầu Node 18+)
cd src/WebApi/frontend
npx tsc --noEmit          # 0 lỗi
```

- Tay: nhập email rác/SĐT 11 số/`javascript:` vào ô link/tên toàn dấu cách/
  mật khẩu ngắn → bị chặn kèm message tiếng Việt; đăng nhập sai 3 lần →
  nút khóa đếm ngược; upload file PDF/ảnh 6MB → bị từ chối.
- Tài khoản test (mật khẩu chung `123Pa$$word!`): `basicuser@gmail.com`
  (ứng viên), `employer@gmail.com` (nhà tuyển dụng), `superadmin@gmail.com`.
