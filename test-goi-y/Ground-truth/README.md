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

## Kết quả chấm lần đầu (2026-11-18, cbf-v7-idf, DB local)

Chấm qua đúng đường production: đăng nhập 15 tài khoản GT, gọi
`GET /api/ketquaphuhops/recommendations?topN=10` (handler `GetSuggestedJobsForCvQuery`,
chấm lại toàn bộ tin đang tuyển bằng scorer hiện hành, không đọc cache cũ).
Nhãn suy từ tiêu đề `bộ NN.variant`: variant 1–3 = dương, 4–5 = nhiễu của đúng ứng viên NN;
tin ngoài bộ không gán nhãn. Script: `tmp/gt-benchmark.mjs`, kết quả đầy đủ:
`tmp/gt-benchmark-result.json`. Dòng `KetQuaPhuHop` của CV GT đã snapshot và khôi phục
nguyên trạng sau khi chấm (1825 dòng trước = sau).

```text
MACRO (15 ứng viên)   P@5=0.60   HitRate@5=1.00   Recall@5=1.00   NDCG@5-trong-bộ=1.0000
Rerank DeepSeek bật 15/15 nhưng không đổi P@5 so với thứ tự luật (DiemPhuHop desc, Id desc)
```

| Chỉ số | Giá trị | Diễn giải |
|---|---|---|
| Recall@5 | 1.00 (15/15) | Cả 3 tin thiết kế khớp đều nằm trong top-5 của mọi ứng viên |
| HitRate@5 | 1.00 | Mọi ứng viên có ít nhất 1 gợi ý đúng trong top-5 |
| P@5 | 0.60 | 2/5 slot còn lại là tin **không gán nhãn**, không phải tin sai (xem dưới) |
| NDCG@5 trong bộ | 1.0000 | 3 tin dương luôn trên 2 tin nhiễu: dương trong top-5, nhiễu ngoài top-10 |

Hai phát hiện phải nói rõ khi trích số:

1. **P@5 = 0.60 không phải lỗi xếp hạng.** Ví dụ ứng viên #03 (Data Analyst): top-5 gồm
   3 tin dương của bộ 03 (điểm 0.834) cộng 2 tin `bộ 13.4` và `bộ 12.5` — vốn là tin
   *nhiễu của ứng viên khác* nhưng được dựng từ đúng profile Data Analyst, nên nội dung
   giống hệt và cùng điểm 0.834. Hòa điểm thì tie-break `Id desc` đẩy tin ID lớn hơn lên
   trước. Tức scorer chấm đúng (nội dung giống → điểm giống), còn "nhiễu" của bộ này là
   "phù hợp thật" của ứng viên cùng vai trò — giới hạn circular của thiết kế GT.
2. **NDCG trong bộ = 1.0000 là đo thật, không phải artifact của giả định "vắng = 0":**
   cả 3 dương hiện diện trong top-5 còn cả 2 nhiễu vắng khỏi top-10, nên thứ tự
   dương > nhiễu được xác nhận trực tiếp, không phụ thuộc giả định.

Hạn chế giữ nguyên như mục "Relation tới benchmark database": nhãn dương thiết kế trước
(circular), một người gán nhãn, tập chỉ đo recall cặp thiết kế + thứ tự trong bộ 5 tin,
không đo chất lượng tuyệt đối trên tin thật chưa gán nhãn.
