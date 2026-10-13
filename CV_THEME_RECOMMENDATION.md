# Agent chọn mẫu CV — theme-v2

## Cách dùng

- “Gợi ý mẫu CV cho Backend Developer junior, một cột, tối giản và ưu tiên ATS.”
- “CV ngành tài chính senior nên dùng mẫu nào?”
- “Chọn giúp tôi mẫu phù hợp cho Data Analyst mid và áp dụng vào bản nháp.”

Chỉ hỏi gợi ý: tối đa ba mẫu, lý do/trade-off và nút xem trước. Yêu cầu chọn/áp dụng:
agent được gọi tool đổi template sau kết quả, chỉ đổi bản nháp và có hoàn tác.
Lưu CV vẫn là thao tác riêng của editor.

## Luồng và nguồn dữ liệu

1. Candidate agent và CV agent đều có `suggest_cv_theme` với tham số ngành, vị trí,
   cấp độ mục tiêu, phong cách, số cột, ưu tiên/bắt buộc ATS và phần nhấn mạnh.
2. Trong editor: `suggestCvThemeForDraft` lấy vị trí/kỹ năng từ form chưa lưu,
   gọi POST `/api/cvthemes/suggest` với `UseSavedCv=false`. Prompt cụ thể override
   mục tiêu trong form; không âm thầm lấy mục tiêu từ CV đã lưu.
3. Ngoài editor: handler chỉ đọc CV thuộc chính người dùng. Không truyền ID thì
   tìm CV mặc định của người đó; không có CV vẫn gợi ý bằng mục tiêu trong prompt.
4. `CvThemeMatcher` đọc metadata hiện có trong `cv_themes`, lọc active/renderer và
   xếp hạng. Không sửa nội dung, role, cấp độ thực tế hoặc database CV.
5. Chat renderer hiển thị card/preview thật. Khi áp dụng, kiểm lại eligibility
   từ `/cvthemes/active` để không dùng kết quả đã cũ sau khi Admin tắt mẫu.

## Contract mẫu render

`src/WebApi/frontend/features/tao-cv/template-manifest.json` chứa slug, số cột thật
và version của renderer. Application embed chính file này vào assembly lúc build;
frontend dùng cùng manifest để parse/validate kết quả. Không fallback một slug lạ
sang mẫu mặc định khi agent chọn mẫu.

Thêm renderer mới:

1. Tạo component và đăng ký trong `template-registry.ts`.
2. Thêm cùng slug/layout/version vào manifest.
3. Tạo metadata qua Admin, rồi bật mẫu khi đã kiểm tra render/export.
4. Chạy `CvThemeMatching.Frontend` để xác nhận manifest/registry không lệch.

## Metadata và matching

Tận dụng các trường sẵn có: `NganhPhuHop`, `ViTriMucTieu`, `CapBac`, `Tags`,
`PhongCachThietKe`, `KhuyenNghiSuDung`, `TranhSuDungKhi`, `GoiYAI`, `ThanThienATS`.
Không cần migration thêm cột. Cấp độ chấp nhận `intern,fresher,junior,mid,senior,
lead,manager`; metadata có thể dùng nhiều giá trị CSV hoặc `all`.

- Tiêu chí người dùng ưu tiên hơn dữ liệu CV.
- Normalize dấu tiếng Việt/casing; alias ngành dùng whole phrases, tránh nhầm
  “IT” với chuỗi trong “hospitality”.
- Cấp độ không được suy ra từ số mục kinh nghiệm hoặc số năm của một kỹ năng.
- Điều kiện số cột/ATS bắt buộc không tự nới; cấp độ biết rõ loại mẫu có cấp độ
  cụ thể không tương thích. Mẫu `all` vẫn là lựa chọn đa dụng.
- Khớp vị trí/ngành: mỗi phần +0.25; cấp độ +0.20; phong cách +0.10;
  kỹ năng tối đa +0.05; phần nhấn mạnh tối đa +0.09; nhãn ATS ưu tiên +0.10.
  Mẫu đa dụng nhận điểm nhỏ hơn; score clamp 0..1, tie-break ổn định.
- Metadata trường hợp nên tránh và bối cảnh còn thiếu được trả trong cảnh báo.
- Điểm là relative ranking, không phải xác suất tuyển dụng. ATS là nhãn metadata,
  không chứng nhận tất cả parser. Admin cần rà độ đúng của metadata.

## Files chính

- Application: `Features/CvTheme/Queries/SuggestCvThemes/`.
- Backend: `CvThemeController`, `CvQueryTools`, hai agent factories/prompts.
- Frontend: `theme-recommendations.ts`, `cv-theme-recommendations.tsx`,
  `use-cv-assistant.ts`, `use-global-cv-assistant.ts`, `CopilotProvider.tsx`.
- `ErrorHandlerMiddleware` nhận cả FluentValidation exception và trả HTTP 400.

## Kiểm thử

- `tests/CvThemeMatching.Checks`: 26 checks, gồm matching/scope/no-write/schema
  và prompt mẫu CV không bị shortcut gợi ý việc làm chặn.
- `tests/CvThemeMatching.Frontend`: manifest, kết quả tool, patch giữ dữ liệu,
  slug không hợp lệ/inactive, eligibility hiện tại.
- `tests/CvThemeMatching.Smoke`: API/PostgreSQL thật cho IT/Data/Y tế/Tài chính,
  hard constraints và foreign-CV rejection.
- `CV_THEME_SMOKE_AGENT=1`: kiểm actual AG-UI/LLM gọi `suggest_cv_theme`.
  Model gateway local `9router` phải chạy và có provider hoạt động.
- Chrome harness đã kiểm preview, draft criteria, apply/undo, inactive rejection,
  không gọi save-version. Auth/model được mock trong harness; API/model kiểm riêng.
