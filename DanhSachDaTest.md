# Danh Sách Đã Test — Smart Recruitment (dev-Khanh test trên nhánh dev-Scu)

Ký hiệu: ✅ xong · 🔶 một phần · ⏸ chờ dev fix/môi trường.

## Theo module API

| Module | CRUD | Phân quyền 401/403 | Ghi chú |
|---|---|---|---|
| Account (login/me/register) | ✅ | ✅ | refresh ✅; forgot/reset/magic/external chỉ validation (chờ SMTP/Google) |
| DanhMucNghe, KyNang, DoanhNghiep, NguoiDung | ✅ | ✅ | Mẫu chuẩn đã nhân rộng |
| HoSoNhaTuyenDung, HoSoUngVien, CVUngVien | ✅ | ✅ | Nhớ datetime UTC, xóa ngược FK |
| DonUngTuyen | ✅ | ✅ (Casbin + ownership) | Chặn trùng đơn, chỉ nộp tin `DangTuyen` |
| TinTuyenDung | ✅ (CRUD + fire thử) | ✅ (ownership theo DN) | Fire/guard đúng; persist chờ BUG-11 |
| NhanSu (invite/accept/list/delete) | ✅ | ✅ | Invite nổ mail nhưng vẫn lưu DB (lấy token từ DB) |
| DanhGia, KetQuaPhanTichCv, KetQuaPhuHop, KinhNghiemLamViec, KyNangUngVien, KyNangTinTuyenDung | ✅ | 🔶 (mẫu 401/403 chung) | Theo chuỗi nối id cha |
| Users, Roles (+assign/remove), RoleClaims (+matrix) | ✅ | ✅ | Trừ `GET users/show` vỡ AutoMapper (BUG-16) |
| Notifications | ✅ | ✅ | Response lệch chuẩn, realtime SignalR chưa test |

## Theo vai trò (scenario)

| Suite | Kết quả |
|---|---|
| E2E_UngTuyen (9 step) | ✅ Passed 9/9 |
| E2E_NTD (10 step) | ✅ Passed (xem/đánh giá đơn đúng DN) |
| E2E_NhanSu (7 step) | ✅ (guard chặn trigger sai đúng luật) |
| E2E_Admin (users/roles/matrix) | ✅ |

## Chưa xong (lý do)
- ⏸ Verify giá trị PUT + fire persist: chờ fix BUG-11 (NoTracking).
- ⏸ Luồng mail/Google E2E: chờ SMTP thật.
- ⏸ `GET users/show`: chờ fix BUG-16.
