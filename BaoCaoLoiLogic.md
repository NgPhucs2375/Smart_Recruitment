# Báo Cáo Lỗi Logic - Smart Recruitment (từ kiểm thử API bằng Apidog)

> Người kiểm thử: dev-Khanh. Nhánh được kiểm thử: dev-Scu (backend Docker build từ nhánh này).
> Công cụ: Apidog + Docker.
> Cách đọc: mỗi lỗi có bước tái hiện bằng API thật, vị trí code, hướng sửa đề xuất và trạng thái.
> Quy ước response project: lỗi nghiệp vụ thường trả `HTTP 200 + Succeeded:false`; lỗi hệ thống trả 4xx/5xx.

---

## BUG-01 [Major] Seed thiếu quyền `nguoidungs` cho admin → 403 toàn module
- **Module:** `GET/POST/PUT/DELETE api/nguoidungs`.
- **Tái hiện:** login `superadmin@gmail.com` → gọi bất kỳ API `nguoidungs` nào → `403 "Bạn không có quyền thực hiện hành động này."`
- **Nguyên nhân:** bảng `Identity.RoleClaims` không có dòng nào `ClaimType='nguoidungs'` cho role `QUAN_TRI_VIEN` (đã query DB xác nhận); `BaseApiController.EnforcePermissionAndExecute` check Casbin rồi fallback DB đều trượt.
- **Sửa đề xuất:** bổ sung grant `nguoidungs = create#delete#edit#list#show` cho `QUAN_TRI_VIEN` trong seed/matrix phân quyền.
- **Trạng thái:** đã cấp tạm trực tiếp vào DB để test tiếp (cần dev fix gốc, nếu reset DB sẽ mất).

## BUG-02 [Major] Gửi ngày không kèm giờ UTC → 500
- **Module:** `POST api/hosoungviens` (`NgaySinh`), `POST api/cvungvien` (`NgayUpload`), khả năng mọi field datetime.
- **Tái hiện:** body `"NgaySinh": "2000-01-01"` → `500 "An error occurred while saving..."`. Đổi `"2000-01-01T00:00:00Z"` → `200`.
- **Nguyên nhân:** `DateTimeKind.Unspecified` bị Npgsql từ chối ở cột `timestamptz` (log backend: `DbUpdateException → ArgumentException ... only UTC is supported`).
- **Sửa đề xuất:** chuẩn hóa `DateTime` về UTC ở tầng Application (hoặc cấu hình Npgsql) + trả 400 validation thay vì 500.

## BUG-03 [Major] Tạo trùng unique → 500 thay vì 400
- **Module:** `POST api/nguoidungs` (trùng `ApplicationUserId`), `POST api/hosoungviens` (trùng `NguoiDungId`).
- **Tái hiện:** POST cùng body 2 lần → lần 2 `500` lỗi save.
- **Sửa đề xuất:** kiểm tra tồn tại trước insert, ném `ApiException` 400 với message rõ ("Hồ sơ đã tồn tại...").

## BUG-04 [Minor - quy ước] "Không tìm thấy" trả `200 + Succeeded:false`
- **Module:** `GET .../show/{id}` (DanhMucNghe, NguoiDung...).
- **Tái hiện:** `show/999999` → `HTTP 200, Succeeded:false, Data:null`.
- **Ghi chú:** nhất quán toàn hệ thống (handler `return new Response<T>("Không tìm thấy...")` + `Ok(...)`) nhưng khác REST chuẩn; team chốt giữ hay đổi 404 rồi test theo.

## BUG-05 [Nghi vấn] Admin không xem được chi tiết đơn ứng tuyển
- **Module:** `GET api/donungtuyen/show/{id}`.
- **Tái hiện:** token admin → `403 "Bạn không có quyền xem đơn ứng tuyển này."` dù qua được Casbin.
- **Nguyên nhân:** `GetDonUngTuyenByIdQuery` kiểm tra ownership — chỉ UngVien sở hữu / NTD cùng doanh nghiệp / Nhân sự đăng tin; nhánh còn lại (gồm admin) `false`.
- **Sửa đề xuất:** xác nhận chủ ý sản phẩm; nếu admin cần giám sát thì thêm nhánh `QUAN_TRI_VIEN → true`.

## BUG-06 [Nghi vấn] Admin không xem được chi tiết tin tuyển dụng
- **Module:** `GET api/tintuyendungs/show/{id}` — tương tự BUG-05 (`GetTinTuyenDungByIdQuery`):
  UngVien chỉ xem tin `DangTuyen`, NTD cùng DN, NS đăng tin; admin luôn 403.
- **Vấn đề:** admin là người duyệt/từ chối tin (`AdminDuyet/AdminTuChoi`) mà không xem được nội dung tin — vô lý nghiệp vụ, khả năng dev sót nhánh.
- **Sửa đề xuất:** thêm nhánh `QUAN_TRI_VIEN → true` (hoặc rule riêng cho tin chờ duyệt).

## BUG-07 [Minor] `GET /api/Notifications` lệch chuẩn response
- Trả object trần `{Notifications, UnreadCount}`, không bọc `Response<T>` (`Succeeded/Code/Message/Data`) như mọi API khác → assertion chung fail, client phải xử lý riêng.
- **Sửa đề xuất:** bọc `Response<NotificationsVm>` (`NotificationsController.cs`).

## BUG-08 [Tech debt] Sai chính tả resource Casbin tin tuyển dụng
- `TinTuyenDungController.cs` dùng `"tinvuyendungs"` (thiếu `t`) trong khi route là `tintuyendungs`. Hiện chạy được vì seed policy ghi theo đúng chuỗi sai.
- **Sửa đề xuất:** sửa code về `tintuyendungs` + sửa seed/policy đồng bộ (làm 1 lần, tránh lỗi 403 hàng loạt sau này).

## BUG-09 [Env/Config] Cấu hình dễ sập khi setup mới
1. `.env` thiếu JWT → `IDX10703: key length is zero`, mọi request (kể cả `/health`, `/swagger`) 500. Nên fail-fast message rõ ràng + document `.env.example`.
2. `BACKEND_PORT` default `8000` trong service backend nhưng `NEXT_PUBLIC_API_URL` default `:5000` → frontend gọi sai khi thiếu `.env`.
3. Tồn tại DB cũ `KLTN` song song `smart_recruitment_db` trong cùng Postgres — dễ sửa nhầm DB khi debug phân quyền.

## BUG-10 [Ghi nhận] Module ThongBao CRUD không tồn tại
- Nhánh hiện tại không có `ThongBaoController`/`Features/ThongBao` (chỉ còn `NotificationsController` đọc + SignalR). Nếu chủ ý gộp thì thôi; nếu không thì thiếu cả module.

---

## BUG-11 [Critical] Mọi API update đều "thành công giả" — DB không đổi gì
- **Module:** mọi `PUT`, `POST .../fire`, state machine (đã verify trên tin tuyển dụng).
- **Tái hiện:** `PUT /api/tintuyendungs/6` đổi `TieuDe` → `200 "Cập nhật tin tuyển dụng thành công."` nhưng query DB `TieuDe` vẫn cũ. `POST /5/fire` (GuiDuyet) → `200 "Cập nhật trạng thái tin thành công."` nhưng `TrangThai` vẫn `Nhap` (trong khi notification side-effect "Tin đã gửi kiểm duyệt" thì CÓ lưu).
- **Nguyên nhân:** `ApplicationDbContext` đặt `ChangeTracker.QueryTrackingBehavior = NoTracking` toàn cục
  (`Infrastructure.Persistence/Contexts/ApplicationDbContext.cs`) → `FindAsync` trả entity detached →
  mọi sửa in-place + `SaveChangesAsync` lặng lẽ không sinh lệnh UPDATE (log backend không hề có `UPDATE`).
  Chỉ `Add` (tạo) và `Remove` (xóa) còn tác dụng.
- **Sửa đề xuất:** bỏ NoTracking toàn cục; các query đọc thì gắn `AsNoTracking()` từng chỗ; các handler update thì `Attach`/`Update` entity (hoặc set `EntityState.Modified`) trước `SaveChanges`.
- **Phạm vi:** chỉ `ApplicationDbContext` (nghiệp vụ) bị; `IdentityContext` (users/roles) không đặt NoTracking nên update Identity vẫn lưu bình thường.
- **Trạng thái:** OPEN — bug nghiêm trọng nhất; toàn bộ test PUT/fire "xanh 200" trước đây đều phải chạy lại sau fix.

## BUG-12 [Major] Seed thiếu action đặc thù ở nhóm Identity
- `roles` thiếu `assign#remove` → admin 403 ở `POST roles/assign` (đã cấp tạm vào DB).
- `users` thiếu `edit#delete` (tra DB thấy) — dev rà soát toàn bộ action đặc thù, đừng chỉ CRUD cơ bản.

## BUG-13 [Major] Trùng tên role → 500 + lộ tên class lỗi
- `POST api/roles` trùng `Name` → `500, Message: "Microsoft.AspNetCore.Identity.IdentityError"`
  (handler ném nguyên object lỗi). So sánh: trùng tên DanhMucNghe trả `Succeeded:false` đàng hoàng.
- **Sửa đề xuất:** check trùng trước + trả 400 message rõ.

## BUG-14 [Minor] Message lỗi sai giá trị hợp lệ khi đăng ký NTD
- `POST register` sai role trả `"Chỉ hỗ trợ: UngVien, NguoiDaiDien"` nhưng code so sánh
  case-sensitive với `"UNG_VIEN"/"NGUOI_DAI_DIEN"` (`AccountService.cs:~140`). Gửi đúng chữ trong message vẫn 400.
- **Sửa đề xuất:** so sánh `OrdinalIgnoreCase` hoặc sửa message đúng giá trị.

## BUG-15 [Major] Invite nhân sự: lưu DB xong mới nổ mail, trả 400
- `POST api/nhansus/invite` khi SMTP trống: bản ghi `LoiMoiNhanSu` đã lưu (lấy được token từ DB)
  nhưng response `400 "No address found."` (do `EmailFrom` trống). Bấm lại = nguy cơ trùng.
- **Sửa đề xuất:** trả token về luôn cho client dev-mode, hoặc gửi mail bất đồng bộ / try-catch riêng mail.

## BUG-16 [Major] `GET users/show/{id}` vỡ AutoMapper
- Tái hiện: show user bất kỳ → `Succeeded:false`,
  `"Missing type map configuration or unsupported mapping. ApplicationUser -> GetUserByIdModel"`.
- Nguyên nhân: thiếu `CreateMap<ApplicationUser, GetUserByIdModel>` trong profile AutoMapper
  (list vẫn chạy vì dùng model khác).
- **Sửa đề xuất:** thêm map còn thiếu; rà soát các `show` khác có dùng model riêng tương tự.

## Đã verify ĐÚNG (ghi nhận dương tính)
- Phân quyền Casbin + RoleClaims theo resource#action hoạt động (401 không token, 403 sai role).
- Check `id URL != Id body → 400` có ở mọi controller.
- State machine đơn/tin + FK `Restrict` (phải xóa ngược Đơn → CV → Hồ sơ) đúng thiết kế.
- Register NTD tự tạo DoanhNghiep + link hồ sơ; login auto-confirm email.
