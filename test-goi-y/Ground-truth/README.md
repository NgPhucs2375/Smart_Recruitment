# Ground-truth - Benchmark gợi ý việc làm

Script tạo dữ liệu độc lập để kiểm thử Agent Recommen-Adam và thuật toán gợi ý.

## Dữ liệu được tạo

- 15 tài khoản ứng viên: `gt.ungvien01@seed.local` đến `gt.ungvien15@seed.local`.
- 15 hồ sơ ứng viên và 15 CV mặc định, mỗi CV có thông tin liên hệ, vị trí, lương, địa điểm, học vấn, kinh nghiệm và kỹ năng khác nhau.
- 75 tin tuyển dụng đang tuyển: mỗi CV có 3 tin được gán nhãn phù hợp trước, 2 tin nhiễu.
- `ground-truth.csv`: 45 nhãn dương độc lập. Mọi cặp CV - tin tuyển dụng không có trong file được xem là nhãn `0` (không phù hợp).

Script dùng doanh nghiệp và nhân sự đang có trong database làm người đăng tin. Vì vậy hãy khởi động `WebApp.Server` một lần trước để seed các role, doanh nghiệp và nhân sự mặc định.

## Chạy

Không lưu chuỗi kết nối trong repository. Truyền nó qua biến môi trường hoặc tham số:

```powershell
$env:GT_CONNECTION = "Host=localhost;Port=5432;Database=smart_recruitment_db;Username=postgres;Password=SuperStrongPassword123!"
dotnet run --project test-goi-y/Ground-truth/Ground-truth.csproj
```

Hoặc:

```powershell
dotnet run --project test-goi-y/Ground-truth/Ground-truth.csproj -- --connection "Host=..." --output test-goi-y/Ground-truth/ground-truth.csv
```

Script có thể chạy lại: nó chỉ xóa các tin có tiền tố `[GT]`, sau đó tạo lại 75 tin và xuất lại CSV. Không xóa dữ liệu người dùng hay tin tuyển dụng không mang tiền tố này.

Mật khẩu của các tài khoản benchmark là `123Pa$$word!`.

## Đo Recommen-Adam

1. Đăng nhập từng tài khoản `gt.ungvienXX@seed.local`.
2. Gửi cùng một câu hỏi cho Agent: `Hãy đề xuất 5 công việc phù hợp nhất với CV mặc định của tôi.`
3. Lưu 5 `TinTuyenDungId` từ tool `GetJobRecommendationsAsync` hoặc câu trả lời cuối của Agent.
4. Đối chiếu mỗi ID với `ground-truth.csv`. ID xuất hiện ở đúng email ứng viên là đúng (`1`), còn lại là sai (`0`).
5. Tính:

```text
Precision@5 = số gợi ý đúng trong top 5 / 5
Hit Rate@5 = số CV có ít nhất một gợi ý đúng trong top 5 / 15
```

`DiemPhuHop` là điểm xếp hạng. `ground-truth.csv` là đáp án độc lập dùng để chứng minh thứ hạng đó có hiệu quả hay không.
