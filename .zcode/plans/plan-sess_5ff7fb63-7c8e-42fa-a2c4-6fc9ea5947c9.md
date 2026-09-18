# Nâng cấp module Agent CV — 4 hạng mục đã chọn

## 1. Bảo mật endpoint agent (nhỏ, làm trước tiên)

- `src/WebApi/WebApp.Server/Program.cs:115-116`: thêm `.RequireAuthorization()` sau `.RequireCors("AllowFrontend")` cho `/api/copilotkit`. Các controller `[Authorize]` đã chạy JWT bearer nên scheme mặc định có sẵn.
- FE đã gửi sẵn `Authorization: Bearer` từ `CopilotProvider.tsx:16-28`. Trong lúc làm sẽ kiểm tra: (a) Next proxy `frontend/app/api/copilotkit/agent-runtime.ts` + `[...path]/route.ts` có forward header này không; (b) `CopilotProvider` đọc `localStorage["accessToken"]` trong khi trang khác đọc `"access_token"` — đối chiếu key mà helper `request` trong `lib/api` dùng, sửa CopilotProvider nếu lệch (nếu không, bật auth sẽ làm chat 401).

## 2. Nâng cấp năng lực agent

**a) Snapshot form đầy đủ chi tiết item** — `frontend/features/ai-cv/cv-assistant-state.ts`:
- Đổi `AssistantItemRef` từ `{id, label}` thành `{id, label, fields}` — `buildAssistantSnapshot` trả đủ field của từng item (ngày, isHienTai, moTa, arrays như congNghe/kyNangSuDung...) để LLM viết lại nội dung có sẵn ("viết lại mô tả kinh nghiệm ABC hay hơn").
- `getCvFormSnapshot` trong `use-cv-assistant.ts` tự hưởng theo (nó gọi lại buildAssistantSnapshot). Không đổi `merge-cv-patch.ts` (match vẫn theo id/nameKeys).

**b) BE tool `list_my_cvs`**:
- Thêm method `GetMyCvsAsync` vào `CvQueryTools.cs`, gửi `GetAllCVUngViensQuery` (đã có sẵn, ownership-filter tại `Application/Features/CVUngVien/Queries/GetAllCVUngViens/GetAllCVUngViensQuery.cs:36-41`) với `_start=0, _end=20, _sort=Created, _order=desc`.
- Đăng ký trong `CvAssistantAgentFactory.CreateAgent()` (tên tool `list_my_cvs`, description: đọc danh sách CV đã lưu, dùng trước khi chỉnh CV có sẵn).

**c) FE tool `loadCvFromBackend`**:
- `use-cv-assistant.ts`: thêm opt `selectCv?: (id: number) => Promise<void>`; tool `loadCvFromBackend({cvId})` — handler gọi `selectCv` (chính là `handleSelect` của `tao-cv-view.tsx:185-197`, đã đảm nhiệm `cvApi.getById` → `manualCvDetailToForm` → setCvData + versions + selectedId); không có `selectCv` thì fallback `router.push('/tao-cv?cv=' + cvId)`. Có toast + report string.
- `tao-cv-view.tsx:93`: truyền `selectCv: handleSelect` vào `useCvAssistant`.
- Cập nhật `CvAssistantInstructions.cs`: mục 9 (READ_OR_ADVISE) — "chỉnh CV đã lưu" → `list_my_cvs` rồi `loadCvFromBackend`; mục 14/15 liệt kê tool mới.

## 3. Dọn dead code + README

- Xóa `src/WebApi/WebApp.Server/Agent/CvAssistant/Tools/CvCommandTools.cs`.
- Xóa cả thư mục `src/Application/Features/CVUngVien/Commands/CreateCVByAgent/` (command + handler + validator — grep xác nhận chỉ còn tự tham chiếu).
- `AgentExtensions.cs`: bỏ đăng ký `CvCommandTools` + khối `#pragma warning disable CS0618` + using thừa.
- Viết lại `Agent/README.md`: bỏ `CvStateAgent.cs`/`CvStateSnapshot.cs` (đã không tồn tại), mô tả đúng tool BE (`get_my_profile`, `get_cv_detail`, `list_my_cvs`, `suggest_jobs_for_my_cv`) + tool FE 7 cái + `navigateToCvEditor`, ghi rõ triết lý form-là-source-of-truth và endpoint đã RequireAuthorization.

## 4. Gợi ý tin tuyển dụng phù hợp với CV default

**Thuật toán (content-based v1, không cần ML):** query mới `GetSuggestedJobsForCvQuery` tại `src/Application/Features/KetQuaPhuHop/Queries/SuggestJobsForCv/`:
- Input: `CvUngVienId?` (null → CV `IsDefault && !IsDaXoa` của user hiện tại qua `ICurrentNguoiDungService` → hoSo), `TopN = 10`. CvId chỉ định phải thuộc hoSo (ownership check như `GetCVUngVienByIdQuery`).
- Load tin `TrangThai == DangTuyen` (enum = 3) và (`NgayHetHan == null || > now`), include `KyNangTinTuyenDungs.KyNang`, `DoanhNghiep`.
- Chấm điểm 0..1: kỹ năng trùng giữa `CVKyNang` (theo `KyNangId` hoặc normalize `TenKyNang`) và kỹ năng tin — có trọng số theo `MucDoYC` (BatBuc > UuTien > KhongBatBuoc); bonus `ViTriUngTuyen` của CV/hoSo khớp `TieuDe`/`DanhMucNghe`, lương mong muốn của hoSo nằm trong [LuongToiThieu, LuongToiDa], `DiaDiemLamViec` khớp `DiaChi` hoSo.
- Phân loại theo `PhanLoaiKetQua`: ≥0.66 Cao, ≥0.33 TrungBinh, còn lại Thap.
- **Persist** kết quả vào bảng `KetQuaPhuHop` (đã có sẵn schema + DbSet, không cần migration): xóa rows cũ của (hoSo, cv) rồi insert mới với `MatchingVersion = "cbf-v1"`, `EvaluateAt = now`, `KyNangThoa/KyNangThieu` dạng chuỗi — nhờ đó trang `/viec-lam/phu-hop` đang rỗng sẽ có dữ liệu thật.
- VM trả về: `TinTuyenDungId, TieuDe, TenDoanhNghiep, DiaDiemLamViec, LuongToiThieu/ToiDa, DiemPhuHop (%), PhanLoai, KyNangThoa[], KyNangThieu[]`.

**Expose cho agent:** method `SuggestJobsForMyCvAsync` (param `cvId?`) trong `CvQueryTools.cs` → đăng ký tool `suggest_jobs_for_my_cv` vào factory. Cập nhật system prompt (`CvAssistantInstructions.cs`): mục READ_OR_ADVISE — "gợi ý việc làm / tôi phù hợp với tin nào" → gọi tool này, trình bày top kết quả kèm % và kỹ năng thiếu, hướng dẫn xem chi tiết tại `/viec-lam/phu-hop`.

## Thứ tự thực hiện + kiểm chứng

1. Dọn dead code (mục 3) → `dotnet build` sạch.
2. Auth endpoint (mục 1) + verify proxy/header FE.
3. `list_my_cvs` + snapshot đầy đủ + `loadCvFromBackend` (mục 2).
4. Suggest jobs (mục 4): query + persist + tool + prompt.
5. README rewrite.
6. Kiểm chứng cuối: `dotnet build`, `npm run lint` / `tsc --noEmit` phía frontend; smoke test thủ công luồng chat (điền form, chỉnh CV đã lưu, gợi ý việc làm).

Rủi ro đã tính: bật auth có thể làm chat 401 nếu proxy không forward header — bước 2 sẽ kiểm tra trước khi chuyển tiếp. Snapshot đầy đủ làm tăng token/context — chấp nhận được với Groq (vài chục KB), chỉ gửi field của item, không gửi toàn bộ moTa giấy tờ dài.