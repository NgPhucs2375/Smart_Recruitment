# Tiến độ nâng cấp AI và hệ gợi ý

Thực hiện theo từng phần để dễ review. Mỗi phần cần có thay đổi cụ thể,
kiểm tra và kết quả trước khi đánh dấu hoàn tất.

## TODO

- [x] **Phần 1 — Chuẩn hóa CV/JD và baseline:** comparison keys cho kỹ năng;
  scorer dùng chung; baseline tái lập; bộ đánh giá offline và kiểm tra.
- [ ] **Phần 2 — NLP và giải thích có dẫn chứng:** chuẩn hóa yêu cầu JD,
  đánh giá cặp CV–JD trực tiếp, skill-gap report, semantic matching.
- [ ] **Phần 3 — Dữ liệu hành vi tập trung:** lưu việc làm theo tài khoản,
  impression/view/apply/feedback và thông tin nguồn gợi ý.
- [ ] **Phần 4 — Lọc cộng tác và hybrid:** item-based baseline, kết hợp các nguồn,
  cold start, chia dữ liệu theo thời gian và so sánh chất lượng.
- [ ] **Phần 5 — Tool AI Agent nâng cao:** công cụ theo role, hiểu bộ lọc tự nhiên,
  giải thích/so sánh và kiểm tra luồng thực tế.

## Phần 1: thiết kế và phạm vi

### Hiện trạng khảo sát

- `GeminiCvStructuredParser` đã trích văn bản CV thành DTO có cấu trúc.
- `CandidateTools.BuildCvAnalysis` đang kiểm tra mức đầy đủ, chưa đánh giá chuyên sâu theo JD.
- Hai query gợi ý lặp công thức chấm điểm; `Norm` cũ chỉ trim/lower.
- Query việc làm tính kỹ năng khớp/thiếu nhưng không điền chúng vào response DTO.
- Bookmark ở frontend dùng localStorage; chưa đủ làm dữ liệu lọc cộng tác tập trung.
- Có benchmark seed database tại `test-goi-y/Ground-truth` để bổ sung đánh giá về sau.

### Dữ liệu chuẩn cho scorer

`CandidateMatchInput`: kỹ năng (catalog ID + tên gốc), vị trí mục tiêu,
lương mong muốn, địa chỉ. `JobMatchInput`: yêu cầu kỹ năng (ID + tên + mức độ),
chức danh, khoảng lương, địa điểm. Hai query dùng CV đã chọn/mặc định;
vị trí, lương, địa chỉ của CV được ưu tiên rồi fallback hồ sơ khi thiếu.

Chuẩn hóa tại thời điểm so khớp, không ghi đè CV/JD:

- Unicode FormKC, chữ thường invariant, gộp khoảng trắng.
- Alias tường minh trong `MatchingTextNormalizer` như JS/JavaScript, CSharp/C#,
  Postgres/PostgreSQL. Đổi bảng alias phải đổi version và chạy đánh giá lại.
- Giữ dấu tiếng Việt và ký tự kỹ thuật `.`, `#`, `+`.
- Không suy diễn Java = JavaScript, SQL = SQL Server, .NET = ASP.NET Core.
- Không dùng substring để khớp tên kỹ năng; cùng ID hoặc cùng khóa alias mới khớp.
- Yêu cầu kỹ năng trùng khóa alias chỉ tính một lần, giữ mức độ yêu cầu mạnh nhất.
- Dẫn chứng tên kỹ năng vẫn dùng tên gốc từ JD.

### Baseline và phiên bản chuẩn hóa

- `ContentBasedMatcher.EvaluateBaseline`: `cbf-v1`, giữ công thức trim/lower cũ.
- `ContentBasedMatcher.Evaluate`: `cbf-v2-normalized`, tích hợp vào cả hai query.
- Kỹ năng bắt buộc/ưu tiên/không bắt buộc có trọng số 3/2/1.
- Điểm kỹ năng = tổng trọng số đáp ứng / tổng trọng số yêu cầu.
- Bonus vị trí 0.10, lương 0.05, địa điểm 0.05; tổng tối đa 1.
- Kết quả trả riêng từng thành phần và danh sách kỹ năng khớp/thiếu.
- Baseline pure scorer dùng cùng input đã chụp; không tái lập cache, quyền hay
  lựa chọn dữ liệu của query cũ. So sánh thuật toán phải dùng cùng snapshot.
- Cache gắn phiên bản scorer để tránh trả kết quả cũ sau deploy.
- `MatchingVersion`/`ExplanationModel` của kết quả lưu DB phản ánh phiên bản mới.

### Hạn chế đã xác định cho phần tiếp theo

Phần 1 chưa dùng embedding, chưa học hành vi. Vị trí/địa điểm vẫn so chuỗi,
chưa hiểu phủ định hoặc tương đương địa danh. Bonus có thể tạo score dù không
khớp kỹ năng; score là điểm xếp hạng, không là xác suất trúng tuyển.
Đánh giá ngữ nghĩa và yêu cầu bắt buộc sẽ được xử lý ở Phần 2.

### Kiểm tra

```powershell
dotnet run --project tests/RecommendationMatching.Checks/RecommendationMatching.Checks.csproj
dotnet run --project tests/RecruitmentLifecycle.Checks/RecruitmentLifecycle.Checks.csproj
```

Xem schema nhãn, công thức Precision/Recall/NDCG và hướng dẫn dữ liệu độc lập ở
`tests/RecommendationMatching.Checks/README.md`.

### Kết quả xác minh — 2026-10-06

- `RecommendationMatching.Checks`: **41 PASS**, gồm 31 kiểm tra normalization,
  scorer, cache key và metrics; 10 kiểm tra query tích hợp với EF InMemory.
- `RecruitmentLifecycle.Checks`: **37 PASS**, vòng đời tin/đơn và phân quyền hiện có.
- Bộ 4 fixture tổng hợp, K=2: macro Precision/Recall/NDCG đều là 0.25 ở baseline,
  0.75 ở bản chuẩn hóa. Đây là ca chẩn đoán alias, không phải kết quả người dùng thật.
- Ca cold start trả rỗng ở cả hai phiên bản, được giữ làm mục tiêu Phần 3–4.
- Kiểm tra query: loại tin đóng/hết hạn; phản hồi và cache giữ skill explanations;
  kết quả DB có version; CV người khác bị từ chối; danh sách ứng viên loại CV xóa
  và hồ sơ không tìm việc; query nhà tuyển dụng chặn role ứng viên và công ty khác.
- Không chạy benchmark database thật/LLM ở bước này. Kiểm tra EF InMemory không
  thay thế xác minh SQL/provider khi tích hợp triển khai.
- Build có cảnh báo nullable CS8632 từ các file hiện có trong dự án.

**Checkpoint:** Phần 1 hoàn tất. Phần 2 là bước tiếp theo: đánh giá CV–JD theo
cặp, dẫn chứng và NLP chuyên sâu.
