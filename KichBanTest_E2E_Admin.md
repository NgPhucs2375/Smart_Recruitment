# Kịch Bản Test E2E_Admin — Một Ngày Làm Việc Của Quản Trị Viên

> Người kiểm thử: dev-Khanh. Nhánh backend: dev-Scu (Docker `:8000`).
> Mục tiêu: admin quản trị người dùng, vai trò, ma trận phân quyền trên trang
> `/user-roles` và `/permission-matrix`. Toàn scenario dùng token admin.

## 1. Bối cảnh (đọc trước khi chạy)

- **Nhân vật duy nhất (admin):** `superadmin@gmail.com`, role `QUAN_TRI_VIEN`.
  Đăng nhập lấy token vào biến `jwt_admin` (login lại nếu quá 60 phút).
- **Nguyên tắc an toàn:** mọi thao tác ghi đều dùng dữ liệu rác (`testuser...`,
  `TestRole_Apidog`, resource `test_resource_apidog`) và dọn cuối chuỗi — không đụng
  4 role gốc, không sửa matrix thật.

## 2. Màn 1 — Quản trị người dùng (trang `/user-roles`)

**S1 — Admin mở danh sách user** (`GET /api/users?_start=0&_end=5`) → `200`.

**S2 — Admin tạo user thử** (`POST /api/users`) → lưu Id vào biến `u_id`
(`$.Data.Id` nếu `Data` là object, `$.Data` nếu là chuỗi GUID).
```json
{
  "RoleId": "29378ab2-6f65-41e7-b35e-1271d4d45ca3",
  "FirstName": "Test",
  "LastName": "User",
  "Email": "testuser.apidog@gmail.com",
  "UserName": "testuser_apidog",
  "PhoneNumber": "0901111222",
  "EmailConfirmed": true,
  "Password": "Test123!",
  "ConfirmPassword": "Test123!",
  "Avatar": []
}
```
Fail thường gặp: trùng email/UserName (đổi số khác là qua).

**S3 — Admin gán thêm vai trò** (`POST /api/roles/assign`):
```json
{ "UserId": "{{u_id}}", "RoleName": "NGUOI_DAI_DIEN" }
```
→ `200`. (Từng 403 vì seed thiếu action `assign` — đã bổ sung vào DB, xem BUG-12.)

**S4 — Admin gỡ vai trò** (`POST /api/roles/remove`, cùng body S3) → `200`.

**S5 — Admin xóa user thử** (`DELETE /api/users/{{u_id}}`) → `200`, GET list lại hết thấy.

## 3. Màn 2 — Quản trị vai trò

**S6 — Admin tạo role thử** (`POST /api/roles`): `{ "Name": "TestRole_Apidog" }`
→ lưu Id vào `role_id`. Trùng tên → `500` lộ message `IdentityError` (BUG-13).

**S7 — Xem/sửa/xóa role** (`GET show`, `PUT` đổi tên, `DELETE`) với Params `id` = `{{role_id}}`.

## 4. Màn 3 — Ma trận phân quyền (trang `/permission-matrix`)

**S8 — Admin mở ma trận** (`GET /api/roleclaims/matrix`) → `200`.

**S9 — Admin lưu ma trận không đổi** (`PUT /api/roleclaims/matrix`): copy nguyên khối
`Data` của S8 làm `{ "Matrix": ... }` → `200`. (Test endpoint mà không đổi quyền ai.)

**S10 — Admin cấp/thu quyền thử** (`POST /api/roleclaims` rồi `DELETE`):
```json
{
  "RoleId": "29378ab2-6f65-41e7-b35e-1271d4d45ca3",
  "ClaimType": "test_resource_apidog",
  "ClaimValue": ["list", "show"]
}
```
→ lưu `rc_id`, xem, sửa còn `["list"]`, xóa dọn.

## 5. Cách chấm đạt
- Assertion mỗi step: tắt contract validation; `Status = 200` + `$.Succeeded = true`.
- Đạt: report Passed toàn bộ; DB không còn user/role/claim thử; 4 role gốc và matrix nguyên vẹn.
- Lưu ý đã biết: `IdentityContext` không dính BUG-11 (NoTracking) nên PUT ở cụm này lưu thật —
  GET lại verify được, khác cụm nghiệp vụ.
