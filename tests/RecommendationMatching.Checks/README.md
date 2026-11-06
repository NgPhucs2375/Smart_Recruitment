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

`fixtures.json` hiện có **24 ca có nhãn graded** (4 ca chẩn đoán gốc + 16 ca dựng thêm +
2 ca trình độ kỹ năng + 2 ca kinh nghiệm).
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

## Bước #1 — trình độ kỹ năng (cbf-v4-graded)

Trọng số yêu cầu khớp không còn cộng đủ 100% chỉ vì trùng tên. Mỗi kỹ năng trong CV mang một
hạng tử thuộc tính mờ `μ ∈ [0,1]` và đóng góp `w_yeucầu · μ`:

| Dữ liệu CV khai | μ | Ý nghĩa |
|---|---|---|
| `CoBan` | 0.40 | từng dùng, chưa làm được việc một mình |
| `TrungBinh` | 0.70 | làm được dưới hướng dẫn |
| `ThanhThao` / `ChuyenGia` | 1.00 | đủ trọng số; chuyên gia không được cộng vượt mức yêu cầu |
| không có trình độ, `SoNamKinhNghiem` ≥ 3 / 1–3 / <1 | 1.00 / 0.70 / 0.40 | suy ra từ số năm khi thiếu nhãn |
| thiếu cả trình độ lẫn số năm | 1.00 | trung tính: dữ liệu trống không phải bằng chứng ứng viên yếu |

Một yêu cầu khớp nhiều dòng CV (trùng tên hoặc cùng `KyNangId`) lấy **bằng chứng mạnh nhất**,
nên CV ghi JavaScript hai lần mức Cơ bản + Thành thạo vẫn tính 1.00.

DB đang chạy: 145/145 dòng `CVKyNang` có `MucDoThanhThao` (Thang Thao 77, Trung Binh 55,
Co Ban 12, Chuyen Gia 1) và 81/145 có số năm → μ trung bình của một kỹ năng thật là 0.837,
tức bước này dịch điểm cả cụm xuống dưới, không đổi thứ tự trong hồ sơ thiếu dữ liệu.

```
MACRO cbf-v1             queries=22 P=0.7500 R=0.8182 NDCG=0.7733
MACRO cbf-v3-calibrated  queries=22 NDCG=0.8825   (tắt hệ số μ, chỉ để đo)
MACRO cbf-v4-graded      queries=22 P=0.8409 R=0.9091 NDCG=0.9049
```

Số 0.8825 là chính công thức bước #3 chạy trên **22** ca (nhiều hơn bảng 0.8954 ở trên hai ca
mới), nên phép so sánh đúng của bước này là 0.8825 → 0.9049. Hai ca mới dựng ra chỉ để nó
đo được: `proficiency-vs-coverage` 0.7967 → 1.0000 và `broad-beginner-vs-narrow-strong`
0.7098 → 1.0000. 20 ca cũ giữ nguyên điểm từng ca vì không ca nào khai trình độ — đó chính là
kiểm chứng "thiếu dữ liệu thì trung tính", không phải ca tự nhiên tốt lên.

## Bước #2 — cổng bắt buộc (cbf-v5-gated)

Lọc theo yêu cầu `BatBuc` là **hội (conjunctive)**, không cộng bù: thiếu một kỹ năng bắt buộc
thì không có bonus vị trí/lương/vị trí nào "trả lại" được. Kết quả trả về thêm
`MissingMandatory` (kèm `MeetsMandatory`) và hai response có `KyNangBatBuocThieu`.

Cố ý **không** đổi `DiemPhuHop`. Lý do đo được, không phải sở thích:

```
MACRO cbf-v4-graded  queries=22 NDCG=0.9049
MACRO cbf-v5-gated   queries=22 P=0.8409 R=0.9091 NDCG=0.9049   <- bằng nhau, có kiểm chứng
GATE cbf-v1          positive=45 thieuBatBuoc=13
GATE cbf-v5-gated    positive=49 thieuBatBuoc=14
```

Check `Gate leaves the score untouched` khoá bất biến đó: mọi cổng nhân vào điểm đều làm màn
 hình đang xếp theo `DiemPhuHop` đổi thứ tự mà không thêm thông tin, và làm điều kiện lọc
`score > 0` (backend lẫn runner, quyết định số tin được gợi ý/được gửi thông báo) đổi theo.

Trên DB đang chạy, cổng cho thấy nó **không thể** là bộ lọc cứng:

| Số liệu | Giá trị |
|---|---|
| Tin còn hiệu lực có ≥1 yêu cầu `BatBuc` | 89/90 (trung bình 1,99 mỗi tin) |
| Dòng `KetQuaPhuHop` thuộc tin có `BatBuc` | 1273/1288 |
| Dòng thiếu ≥1 kỹ năng bắt buộc | 1132 (87,9%) |
| Dòng loại `Cao` (131 dòng) đạt toàn bộ bắt buộc | 125 |
| Dòng `Cao` bị gắn nhãn "chưa đạt bắt buộc" | 5 (0,4% toàn bộ, 3,8% loại Cao) |

87,9% thì không gọi là "cổng" được — gọi là dán nhãn đỏ lên mọi thẻ. Còn 5 dòng `Cao` bị gắn
nhãn đều là tin `[GT] Backend Developer .NET - bộ ...` (benchmark ground-truth), lý do thiếu
ghi là `.NET` trong khi CV viết `.NET Core`: **nhãn này đang chỉ đúng bệnh của bước #5**
(khoảng trống từ vựng kiểm soát), không phải ứng viên thiếu kỹ năng. Đó là lý do bước #2 chỉ
dùng để *giải thích* và bước #5 mới là chỗ sửa.

## Bước #4 — utility số năm và địa điểm (cbf-v6-utility)

Hai tín hiệu phụ chuyển từ "có/không" sang **utility có dấu**, mỗi tín hiệu bị chặn trong ±0,05
nên không lật được thứ tự của phần kỹ năng:

```
experienceBonus = 0,05 · (2·min(1, soNamUngVien / soNamYeuCau) − 1)
locationBonus   = 0,05 trung ca quan  |  0,025 trung thanh pho  |  0 khac noi
```

`KinhNghiemYeuCau` là text tự do, nên parser lấy **cận dưới của dải** (số đầu tiên):
"2 năm" → 2, "Tối thiểu 1-3 năm kinh nghiệm ở vị trí tương đương" → 1,
"Tối thiểu 3 năm kinh nghiệm phát triển .NET/.NET Core; ..." → 3 (số trong ".NET" không bị tính),
"Không yêu cầu kinh nghiệm" và "0 - 1 năm (chấp nhận sinh viên năm cuối)" → 0 (trung tính).
DB đang chạy: 89/90 tin hiệu lực đọc được một số năm; phân bố "2 năm" 25 tin, "4 năm" 20,
"3 năm" 15, "5/6/7 năm" 5+5+5, 14 tin còn lại là câu dài.

**Số năm của ứng viên lấy từ `CVKyNang.SoNamKinhNghiem`, không phải `KinhNghiemLamViec`.**
Lý do là số liệu, không phải sở thích: bảng `KinhNghiemLamViec` theo hồ sơ có **0 dòng trên toàn
bộ 27 hồ sơ đang tìm việc**, tức `SoNamKinhNghiem` mà màn HR đang hiển thị luôn là 0;
trong khi 16/27 CV có số năm theo kỹ năng (15 CV đạt ≥2 năm, cao nhất 8 năm). Chọn nguồn này
còn giúp bước #4 không cần thêm query nào — dữ liệu đã nằm trong `MatchSkill.Years` từ bước #1.
CV không có số năm ở mọi kỹ năng → **trung tính**, không bị coi là chưa đi làm.

```
MACRO cbf-v1         queries=24 P=0.7708 R=0.8333 NDCG=0.7789
MACRO cbf-v6-utility queries=24 P=0.8542 R=0.9167 NDCG=0.9194
```

Hai ca mới/mới sửa, đo riêng từng cái:

| Ca | cbf-v1 | cbf-v6 | Ghi chú |
|---|---|---|---|
| `location-district-vs-city` | 0.8428 | 1.0000 | Trước đây "quận trùng" và "thành phố trùng" cùng 0,05, thứ tự do ID quyết định |
| `experience-required-vs-actual` | 0.6806 | 1.0000 | Ba tin cùng kỹ năng, chỉ khác số năm đòi; ID đã đổi tên để tie-break không cứu được baseline |
| `experience-data-missing` | 1.0000 | 1.0000 | Ca giữ dáng: nếu code coi "thiếu dữ liệu" thành 0 năm thì tin đòi 5 năm bị tụt xuống dưới tin 6 yêu cầu khớp 4 |

Địa chỉ VN theo quy ước "quận, tỉnh/thành phố" nên **đoạn cuối là tỉnh/thành, đoạn kề trước là
quận**; 15 giá trị `DiaDiemLamViec` và 15 giá trị `DiaChi` đang chạy đều đúng dạng này
("Bình Thạnh, TP. Hồ Chí Minh", "Cầu Giấy, Hà Nội"), và `LocationKey` đã gộp "TP. HCM"/"TP HCM".
Giới hạn ghi rõ: "Thủ Đức, TP. Hồ Chí Minh" và "Quận 1, TP. Hồ Chí Minh" chỉ được tính cùng
thành phố, vì tách quận theo cấp hành chính thật cần một bảng danh mục — chưa làm.

Tác động trên 1288 dòng `KetQuaPhuHop` đang tồn tại (tính theo đúng hai luật mới):

| Nhóm | Số dòng | Thay đổi |
|---|---|---|
| Trùng thành phố, không trùng quận | 219 | −0,025 (từ 0,05 xuống 0,025) |
| Trong 219 dòng đó, điểm rơi khỏi ngưỡng Cao | 6 | nhãn `PhanLoai` Cao → TrungBinh |
| Đủ số năm yêu cầu | 604 | +0,05 |
| Thiếu số năm yêu cầu | 121 | bị trừ theo tỉ lệ, tối đa −0,05 |
| CV không có số năm | 528 | trung tính, không đổi |

Bất biến `score > 0` vẫn giữ: điểm kỹ năng nhỏ nhất có thể khác 0 là `(1·0,4 + 5·0,4)/(22 + 5)`
= 0,089 (một yêu cầu trọng số 1 khớp ở mức Cơ bản, tin dài nhất W=22), lớn hơn mức phạt tối đa 0,05,
nên không cặp nào đang được gợi ý bị xoá chỉ vì thiếu kinh nghiệm. Check
`Maximum experience penalty cannot delete a CV that matches one requirement` khoá lại điều đó.

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
