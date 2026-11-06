# Recommendation matching checks — Phần 1

Chạy từ thư mục gốc, không cần database, Redis hoặc API AI:

```powershell
dotnet run --project tests/RecommendationMatching.Checks/RecommendationMatching.Checks.csproj
```

Chạy với bộ cặp CV–JD đã gán nhãn theo cùng schema JSON:

```powershell
dotnet run --project tests/RecommendationMatching.Checks/RecommendationMatching.Checks.csproj -- "path/to/labeled-cases.json"
```

Runner kiểm tra Unicode tiếng Việt, alias, kỹ năng khác nhau, trọng số,
trùng kỹ năng, dữ liệu thiếu, điểm thành phần, version cache và công thức metrics.
Ngoài ra, runner kiểm tra hai query với EF InMemory: quyền truy cập,
tin còn tuyển, tập CV tìm việc, response, cache và kết quả lưu DB.
Sau đó so sánh `cbf-v1` với phiên bản scorer hiện hành (ô `Version` trong
`ContentBasedMatcher`) trên **cùng dữ liệu và K**, nên mỗi lần đổi công thức phải
tăng `Version` và ghi số mới vào phần dưới thay vì sửa số cũ — bảng cũ là mốc so sánh.

## Quy ước đánh giá

- `relevance`: 0 = không phù hợp; 1 = ít phù hợp; 2 = phù hợp; 3 = rất phù hợp.
- Mỗi item trong tập đánh giá phải có nhãn tường minh. Không mặc định item chưa được đánh giá là âm.
- Precision@K: số item có relevance > 0 trong top K / K. Trả ít hơn K vẫn chia K.
- Recall@K: số item phù hợp được trả / tổng item phù hợp trong tập đã gán nhãn.
- NDCG@K: gain = `2^relevance - 1`, discount = `log2(rank + 1)`; chia DCG lý tưởng.
- Query không có item phù hợp có Recall/NDCG = 0 theo quy ước runner.
- Xếp điểm giảm dần, hòa điểm theo ID ordinal; điểm 0 không được trả, giống điều kiện lọc score của backend.
- `MACRO`: trung bình theo query, không gộp tất cả cặp thành một query.

`fixtures.json` hiện có **20 ca có nhãn graded** (4 ca chẩn đoán gốc + 16 ca dựng thêm).
Mỗi ca mang trường `note` ghi *lý do gán nhãn* để người sau kiểm tra lại được từng dòng.
Nhãn do **một người** quyết định theo kinh nghiệm tuyển dụng IT phổ thông, chưa có người
thứ hai độc lập → **chưa tính được Cohen's κ**, và đó là hạn chế phải nói rõ khi trích số.
Cold start và `react-native-not-react` được giữ nguyên để lộ điều kiện lọc `score > 0`
của cả runner lẫn backend: item nhãn 1 nhưng điểm 0 thì bị loại khỏi danh sách.

## Số gốc trước khi đổi công thức

```
MACRO cbf-v1           queries=20 P=0.7250 R=0.8000 NDCG=0.7753
MACRO cbf-v2-normalized queries=20 P=0.8250 R=0.9000 NDCG=0.8753
```

Ca mà `cbf-v2-normalized` còn sai, và mỗi ca chỉ đúng một việc cần sửa:

| Ca | NDCG v2 | Sai ở đâu | Bước sửa |
|---|---|---|---|
| `denominator-comparability` | 0.6806 | Tin chỉ ghi 1 yêu cầu đạt 1.0, vượt tin 5 yêu cầu khớp cả 2 bắt buộc | #3 + #5 |
| `location-district-vs-city` | 0.6806 | Quận/huyện và thành phố nhận cùng một bonus 0.05, tie-break theo ID đẩy "khác tỉnh" lên đầu | #4 utility |
| `salary-band-fit` | 0.7592 | Dải lương cao hơn kỳ vọng bị xử như không có tín hiệu | #4 utility |
| `core-rarity-idf` | 0.6806 | "Giao tiếp tốt/Làm việc nhóm" (có ở gần mọi JD) thắng Kubernetes | #5 IDF + vocabulary |
| `alias-node-abbreviation` | 0.7872 | `Node` ≠ `Node.js`, `Express` ≠ `Express.js` | #5 vocabulary |
| `alias-ml-abbreviation` | P=0.6667 | `ML` ≠ `Machine Learning` | #5 vocabulary |
| `unknown-candidate-cold-start` | 0 | CV không có kỹ năng thì mọi tin đều điểm 0 | ngoài phạm vi (cần feature số năm/học vấn) |

## Bước #3 — calibration (cbf-v3-calibrated)

Bao phủ kỹ năng không còn là `matched/total` thuần mà là ước lượng Bayesian có kiểm soát phương sai:

```
skillScore = (W_matched + p·π) / (W_total + p),  π = 0.40, p = 5
```

π và p chọn theo dữ liệu đang chạy, không theo số lý thuyết. 90 tin còn hiệu lực có
179 yêu cầu `BatBuc`, 279 `UuTien`, 32 `KhongBatBuoc` (enum lưu bằng số 2/1/0 — đọc
`MucDoYC` chứ đừng so chuỗi), tổng trọng số mỗi tin từ 9 đến 22 và **76/90 tin đúng W=12**;
1.288 dòng `KetQuaPhuHop` do cbf-v2 ghi có điểm trung bình 0.2321, cao nhất 1.0000.
Với (π=0.4, p=5), ngưỡng `PhanLoai` cũ giữ nguyên ý nghĩa trên chính các tin có thật:

| Cấu trúc tin | cbf-v2 → nhãn | cbf-v3 → nhãn |
|---|---|---|
| W=12, khớp 12/12 | 1.000 → Cao | 0.824 → Cao |
| W=12, khớp 10/12 | 0.833 → Cao | 0.706 → Cao |
| W=12, khớp 9/12 | 0.750 → Cao | 0.647 → TrungBinh |
| W=12, khớp 3/12 | 0.250 → Thap | 0.294 → Thap |
| W=3 (tin chỉ ghi 1 yêu cầu), khớp hết | 1.000 → Cao | 0.625 → TrungBinh |

Ở tin điển hình W=12, loại Cao đòi khớp ≥ 10/12 trọng số; trần 1.0 biến mất hoàn toàn
vì `(W + pπ)/(W + p) < 1` với mọi W.

```
MACRO cbf-v3-calibrated queries=20 P=0.8250 R=0.9000 NDCG=0.8954
```

Precision/Recall không đổi (không item nào bật lên hoặc tắt đi: điểm 0 vẫn là 0), toàn bộ
+0.0201 NDCG đến từ hai ca từng bị tie-break theo ID quyết định thay vì điểm:
`salary-band-fit` 0.7592 → 1.0000 và `location-district-vs-city` 0.6806 → 0.8428.

`denominator-comparability` vẫn 0.6806: smoothing đã sửa đúng bệnh mà ca này mô tả
(hai tin không còn cùng điểm 1.0 — 0.625 vs 0.500) nhưng **không đảo được thứ tự**, và đó
là giới hạn toán của chính công thức, không phải lỗi cài đặt. Viết theo dạng
`π + (M − πW)/(W + p)`, tin W=3 xếp trên tin W=11 khi và chỉ khi `p < 25`, tức mọi p hữu ích đều
không đủ. Muốn "tin 5 yêu cầu khớp cả 2 bắt buộc" vượt "tin 1 yêu cầu khớp cả 1" thì điểm
phải kể **lượng bằng chứng tuyệt đối**, tức IDF/bước #5 — không phải thêm một hệ số
"phủ ngược CV" nhân tạo (hệ số đó phạt CV rộng, là thứ ta không muốn trong gợi ý việc).


## Relation tới benchmark database

`ground-truth.csv` + `test-goi-y/Ground-truth` là benchmark chạy trên DB thật, nhưng
**cả 45 cặp đều nhãn 1** (tin được *thiết kế* để khớp từng ứng viên). Tập chỉ có dương tính
đo được **recall của đúng cặp đó**, không đo được **thứ tự**, vì không có negatives để xếp
nhầm. Vì vậy hai bộ này bổ sung nhau, không thay thế nhau: fixtures ở đây giữ vai trò
cột so sánh ranking, ground-truth giữ vai trò kiểm chứng trên dữ liệu thật.
Muốn ground-truth đo được ranking thì phải thêm các tin *cố ý không khớp* cho cùng
ứng viên và gán nhãn 0/1/2 — việc đó để riêng, không sửa dữ liệu của luồng khác.

Để báo cáo nghiên cứu: thu thập CV/JD đại diện nhiều ngành, gán nhãn độc lập
trước khi chạy scorer, lưu phiên bản dữ liệu và người gán nhãn, tách tập phát triển
và đánh giá. Với lịch sử tương tác ở các phần sau, chia theo thời gian và chỉ dùng
dữ liệu có trước mốc đánh giá. Nhãn từ score của chính thuật toán không phải ground truth.
