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

`fixtures.json` hiện có **25 ca có nhãn graded** (4 ca chẩn đoán gốc + 16 ca dựng thêm +
2 ca trình độ kỹ năng + 2 ca kinh nghiệm + 1 ca dựng từ dữ liệu thật).
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
| `denominator-comparability` | 0.6806 | Tin chỉ ghi 1 yêu cầu đạt 1.0, vượt tin 5 yêu cầu khớp cả 2 bắt buộc | #3 (đã) — IDF bước #5 không sửa được, xem cuối mục Bước #5 |
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

## Bước #5 — từ vựng kiểm soát + IDF (cbf-v7-idf)

Hai việc đi cùng nhãn "#5" nhưng số đo rất khác nhau, nên tách ra và giữ cả kết quả xấu.

### (a) Từ vựng kiểm soát — có tác dụng thật trên dữ liệu đang chạy

Bảng `SkillAliases` trong `MatchingTextNormalizer` chỉ nối những biến thể chữ **thật sự tồn tại**
trong DB: danh mục kỹ năng có đúng hai họ trùng nhau — {`.NET`, `.NET Core`} và {`CI CD`, `CI/CD`}.
Không có alias nào ánh xạ chuỗi con (`React Native` ≠ `React`, `.NET Framework` ≠ `.NET Core`).

Số đo trên dữ liệu thật (90 tin hiệu lực × pool hồ sơ đang tìm việc):

| Phep đo | Kết quả |
|---|---|
| Tin có ≥2 dòng yêu cầu cùng một key (mẫu số bị phát) | **0** — phần gộp trùng là chốt chống hồi quy, không phải khoản thắng |
| Dòng chỉ khác nhau ở hoa/thường | 10 — matcher cũ đã xử lý, bước này không thêm gì |
| Cặp (hồ sơ, tin) khớp được **chỉ vì** gộp biến thể | **13** |
| ...trong đó yêu cầu là `BatBuc` (tức nhãn "thiếu bắt buộc" ở bước #2 biến mất) | **13/13** (kiểm lại từng tin: `.NET` và `.NET Core` đều mức BatBuc ở #1, #59, #60, #87–#89) |
| Kỹ năng vẫn giữ riêng sau khi gộp | `ASP.NET Core` (UuTien ở chính các tin trên) không bị nhập vào `.NET` |
| Tác dụng phụ lên IDF | gộp biến thể làm df(`.net`) tăng 5 → 8, trọng số 1,15 → 0,98: `.NET` không còn bị coi là hiếm |

13 dòng đó gồm đúng 5 dòng `Cao` mà bước #2 đã đánh dấu là "thiếu `.NET`" (hồ sơ #2 × 5 tin
`[GT] Backend Developer .NET - bộ ...`, CV ghi `.NET Core`), cộng 5 dòng `Thap` của hồ sơ #11
và 3 dòng của hồ sơ #14 (CV ghi `.NET`, JD ghi `.NET Core`). Nhãn sai ở bước #2 là triệu chứng,
bước #5 là chỗ chữa, và chữa đúng: không còn cặp nào bị báo thiếu vì cách viết.

### (b) IDF — cơ chế đúng, đất diễn trên 90 tin còn hẹp

```
df(k)        = số tin hiệu lực có yêu cầu k (sau khi gộp alias)
idf(k)       = ln((90 + 1) / (df + 1))
weight(k)    = clamp(idf(k) / m, 0.5, 2.0),  m = Σ df·idf / Σ df   (chia theo TAN SO)
matchedWeight += w(MucDoYC) · weight(k) · μ(trình độ)      // chi nhan vao TU SO
totalWeight   += w(MucDoYC)                                // mau so giu nguyen nhu buoc #3
```

Hai quyết định định hình đều đã đo trước khi chọn:

**Chặt nào của IDF.** Nhân cả vào mẫu số thì gần như vô nghiệm: nếu mọi yêu cầu của một tin
cùng tần số, nhân tử và nhân mẫu bằng nhau nên tỉ số không đổi, IDF chỉ kéo điểm về π. Bảng dưới
là cùng fixtures, cùng bảng df, chỉ đổi chỗ nhân:

| Cách đặt IDF | `core-rarity-idf` | `live-df-generic-vs-niche` | MACRO (25 ca) |
|---|---|---|---|
| Không dùng (chỉ alias) | 0.6806 | 0.7592 | 0.9215 |
| Nhân vào **cả tử và mẫu** | 0.8428 | 0.8428 | 0.9313 |
| Nhân vào **tử số** (đã chọn) | **1.0000** | **1.0000** | **0.9439** |

**Chuẩn hoá theo cái gì.** Chia cho trung bình *số kỹ năng khác nhau* (cách thông hay bị viết tắt)
khiến 90 tin đang chạy nhận hệ số trung bình **0,836 trên mỗi đơn vị trọng số yêu cầu** — tức IDF
biến thành một cú trừ điểm đồng loạt: 70 cặp loại `Cao` rơi xuống 45 và **không cặp nào tăng lên**.
Chia cho trung bình *theo tần số* (Σ df·idf / Σ df) thì hệ số đó là **1,008**, đúng ý định "giữ
nguyên hiệu lực của bước #3, chỉ đổi thứ tự tương đối". Check
`Average credit per unit of live requirement weight stays at one` khoá lại điều này.

Trọng số thật của corpus đang chạy (92 key sau khi gộp alias, dựng từ 90 tin): Excel **0,50**
và SQL **0,50** (đụng sàn, vì df 32/31 = 1/3 số tin), Docker 0,64, Python 0,80, Git 0,90,
`.NET` 0,98, Power BI 0,98, ASP.NET Core/C# 1,03, Kubernetes/Linux/CI CD 1,15, các kỹ năng df=1
khoảng 1,6. Hình phân phối: 23/92 key có df=1, chỉ 3 key có df≥15, đúng 2 key đụng sàn và
**không key nào đụng trần** — corpus 90 tin quá nhỏ để IDF tạo ra biến động lớn.

Kết quả fixtures (cbf-v1 → cbf-v7-idf, K và dữ liệu như nhau):

```
MACRO cbf-v1        queries=25 P=0.7800 R=0.8400 NDCG=0.7781
MACRO cbf-v7-idf    queries=25 P=0.8800 R=0.9400 NDCG=0.9439
```

| Ca | cbf-v1 | cbf-v7 | Ghi chú |
|---|---|---|---|
| `core-rarity-idf` | 0.6806 | 1.0000 | Ca nhân tạo, dựng để kiểm tra cơ chế: hai kỹ năng mềm có df 78/90 và 85/90 |
| `live-df-generic-vs-niche` | 0.7592 | 1.0000 | **Ca dựng từ dữ liệu thật**: JD #1, #2, #69 nguyên văn + bảng df 93 kỹ năng của 90 tin đang chạy |
| `denominator-comparability` | 0.6806 | 0.6806 | **Không đổi — IDF không sửa được ca này** |

Vì sao `denominator-comparability` vẫn 0.6806: ca đó so một tin ghi đúng 1 yêu cầu với một tin
5 yêu cầu. Khớp 1/1 thì tỉ lệ phủ vẫn là 1.0 bất kể trọng số, vì IDF nhân cả tử số lẫn mẫu số
của *cùng một* yêu cầu đó. Muốn sửa phải đổi cách so mẫu số (λ trộn giữa "độ phủ" và "lượng bằng
chứng"),
và thử trên dữ liệu cho thấy λ đủ lớn để lật ca này cũng đủ lớn để đẩy một tin W=12 khớp 9/12
vượt ngưỡng Cao — mà 76/90 tin đang chạy có W=12, nên cái giá là nhãn `PhanLoai` của toàn bộ
danh sách. Đó là lý do để nguyên, không chỉnh.

Kết quả mô phỏng trên dữ liệu thật (chỉ phần kỹ năng, chưa cộng bonus; 776 cặp hồ sơ×tin có
≥1 key trùng nhau, chấm lại bằng đúng công thức mới trong SQL):

| Nhóm | cbf-v6 (không IDF) | cbf-v7-idf |
|---|---|---|
| Cặp đạt ngưỡng Cao (≥0,66) | 70 | 65 (8 rơi, 3 tăng) |
| Cặp rơi từ TrungBinh xuống Thap | — | 28 |
| Cặp tăng từ Thap lên TrungBinh | — | 1 |
| Chênh lệch trung bình | — | −0,041 |
| Chênh lệch lớn nhất | — | ±0,169 |

Hướng dịch có chủ đích: điểm của những cặp khớp toàn kỹ năng phổ thông tụt xuống, và trung bình
toàn corpus vẫn 1,008 — cặp nào khớp kỹ năng hiếm thì không bị trừ. Vẫn còn một độ trễ trung bình
−0,041 vì CV khớp các kỹ năng df cao nhiều hơn mức trung bình của chính các JD (Excel/SQL vừa phổ
thông trong tin vừa phổ thông trong CV), nên phân phối *được khớp* lệch về phía sàn 0,50. Điều kiện
lọc `score > 0` không đổi: điểm kỹ năng dương nhỏ nhất là `(1·0,5·0,4 + 5·0,4)/(22 + 5)` = **0,0815**
> 0, nên không cặp nào đang được gợi ý bị loại chỉ vì IDF.

**Giới hạn phải nói thẳng.** Premise của ca `core-rarity-idf` ("giao tiếp tốt/làm việc nhóm có
trong gần mọi JD") **không tồn tại trong dữ liệu này**: trên 90 tin, `Communication` chỉ xuất hiện
ở 13 tin, `Teamwork` ở 1 tin, và trong text tự do của JD thì cụm "giao tiếp" chỉ có ở **1/90** tin.
Tức là trên DB đang chạy, IDF không có đất diễn với kỹ năng mềm — nó chỉ hạ giá Excel/SQL/Docker.
Cơ chế sẽ có ý nghĩa khi corpus lớn hơn (vài nghìn tin) hoặc khi đọc thẳng mô tả JD, cả hai đều
chưa làm. `SkillCorpusLoader` hiện query ~490 dòng mỗi lần chấm và không cache; `WeightOf` trả 2,0
cho key chưa từng thấy (an toàn hơn là coi nó vô giá trị), và đường đó chỉ chạy khi JD dùng tên
ngoài danh mục. Bảng df trong ca `live-df-generic-vs-niche` lưu theo *từng tên trong danh mục*
(`".NET"` 5, `".NET Core"` 3) và `BuildFromFrequencies` lấy max khi gộp, còn đường production đếm
DISTINCT theo từng tin nên cho hợp nhất đúng (8): hai con số lệch nhau ở duy nhất key `.NET`,
không ảnh hưởng xếp hạng của ca đó vì `.NET` không nằm trong tập kỹ năng khớp.

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
