# Tài khoản đã seed

Mật khẩu mặc định của tất cả tài khoản bên dưới:

```text
123Pa$$word!
```

## Tài khoản mặc định

| Vai trò | Username | Email |
|---|---|---|
| Quản trị viên | `superadmin` | `superadmin@gmail.com` |
| Người đại diện | `employer` | `employer@gmail.com` |
| Ứng viên | `basicuser` | `basicuser@gmail.com` |

## Người đại diện doanh nghiệp

| STT | Username | Email |
|---:|---|---|
| 1 | `daidien.saokhue` | `daidien.saokhue@seed.local` |
| 2 | `daidien.mekong` | `daidien.mekong@seed.local` |
| 3 | `daidien.anphat` | `daidien.anphat@seed.local` |
| 4 | `daidien.saoviet` | `daidien.saoviet@seed.local` |
| 5 | `daidien.pixel` | `daidien.pixel@seed.local` |
| 6 | `daidien.thinhvuong` | `daidien.thinhvuong@seed.local` |
| 7 | `daidien.xanhfarm` | `daidien.xanhfarm@seed.local` |
| 8 | `daidien.trithuc` | `daidien.trithuc@seed.local` |
| 9 | `daidien.donganh` | `daidien.donganh@seed.local` |
| 10 | `daidien.bienngoc` | `daidien.bienngoc@seed.local` |

## Ứng viên

| STT | Username | Email |
|---:|---|---|
| 1 | `ungvien.mai` | `ungvien.mai@seed.local` |
| 2 | `ungvien.hung` | `ungvien.hung@seed.local` |
| 3 | `ungvien.huong` | `ungvien.huong@seed.local` |
| 4 | `ungvien.tuan` | `ungvien.tuan@seed.local` |
| 5 | `ungvien.lan` | `ungvien.lan@seed.local` |
| 6 | `ungvien.mhoang` | `ungvien.mhoang@seed.local` |
| 7 | `ungvien.nga` | `ungvien.nga@seed.local` |
| 8 | `ungvien.nam` | `ungvien.nam@seed.local` |
| 9 | `ungvien.thang` | `ungvien.thang@seed.local` |
| 10 | `ungvien.hoa` | `ungvien.hoa@seed.local` |

## Nhân sự doanh nghiệp

Seed tạo **5 tài khoản nhân sự cho mỗi doanh nghiệp hiện có trong database**. Vì `dn.Id` phụ thuộc dữ liệu thực tế nên username/email được sinh theo mẫu:

| Vai trò | Username | Email |
|---|---|---|
| Nhân sự | `nhansu.dn{DoanhNghiepId}.{01..05}` | `nhansu.dn{DoanhNghiepId}.{01..05}@seed.local` |

4 = SmartTest
5 = saokhue
tự mò số tự tăng

Ví dụ với doanh nghiệp có `Id = 12`:

```text
nhansu.dn12.01 / nhansu.dn12.01@seed.local
nhansu.dn12.02 / nhansu.dn12.02@seed.local
nhansu.dn12.03 / nhansu.dn12.03@seed.local
nhansu.dn12.04 / nhansu.dn12.04@seed.local
nhansu.dn12.05 / nhansu.dn12.05@seed.local
```

Trong database mới có dữ liệu seed mặc định, thường có 11 doanh nghiệp (1 doanh nghiệp demo và 10 doanh nghiệp bulk), tương ứng 55 tài khoản nhân sự.

## Ghi chú

- Seed được chạy tại `src/WebApi/WebApp.Server/Initializer/ApplicationInitializer.cs`.
- Các seed account đều được xác nhận email và mở khóa để có thể đăng nhập ngay.
- Seed có tính idempotent: chạy lại sẽ cập nhật mật khẩu, role và trạng thái thay vì tạo trùng tài khoản.
