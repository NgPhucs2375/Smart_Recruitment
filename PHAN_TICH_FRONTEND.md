# Phân tích kỹ thuật Frontend Website


> Phạm vi: source trong `src/WebApi/frontend`. Không đưa password, token, API key hoặc giá trị nhạy cảm vào tài liệu.

## 1. Công nghệ Frontend

- **Framework:** Next.js **16.3.1**, App Router; React **19.2.8**.
- **Ngôn ngữ:** TypeScript (`^5`).
- **Build:** Next.js CLI (`next build`); dev mặc định dùng Turbopack, có script chạy Webpack.

## 2. Thư viện chính

| Nhóm | Công nghệ |
|---|---|
| Routing | Next.js App Router; `@refinedev/nextjs-router`. Không có `react-router-dom`. |
| Styling/UI | Tailwind CSS 4, CSS tùy chỉnh, `@base-ui/react`, UI components nội bộ; `next-themes`, `sonner`. Không thấy Bootstrap, MUI hoặc Ant Design. |
| State/data state | React hooks; `@refinedev/core` cho auth/data provider và truy vấn. Không thấy Redux/Zustand hoặc store riêng. |
| API/realtime | Native `fetch` là chính; `@microsoft/signalr` cho realtime. `axios` có trong dependencies nhưng không thấy sử dụng trong mã frontend. |
| Form/validation | `react-hook-form`, `zod`, `@hookform/resolvers`. |
| AI/OAuth | CopilotKit, AG-UI client; `@react-oauth/google`. |

## 3. Cấu trúc thư mục Frontend

- `app/` — route/page theo App Router, layout và API route handlers.
- `components/` — giao diện dùng chung, auth, layout/navigation, CV và UI primitives.
- `features/` — tính năng theo nghiệp vụ: việc làm, hồ sơ, CV, doanh nghiệp, AI-CV, admin, settings.
- `hooks/` — hooks cho auth, CV, bookmarks, theo dõi công ty, v.v.
- `lib/` — API clients (`lib/api/`), auth/access control, data provider, schemas, types, utils và proxy.
- Không thấy thư mục `store/` hoặc `services/` riêng; API/service logic chủ yếu ở `lib/api/` và trong từng feature.

## 4. Backend/API và Authentication

- **Backend chính:** ASP.NET Core Web API, target **.NET 10**; có Entity Framework Core/Npgsql cho PostgreSQL.
- **Kiểu API:** REST qua HTTP; frontend gọi `/api/dotnet/*`, Next.js route handler proxy tới backend .NET.
- **Realtime:** SignalR cho chat và thông báo; thông báo có polling fallback.
- **HTTP client:** `fetch` được dùng trực tiếp và trong Refine data provider; `axios` không thấy được gọi trong source.
- **Authentication:** JWT Bearer; đăng nhập email/password, Google OAuth, magic link; có refresh token.
- **Lưu trữ phía browser:**
  - `localStorage`: access/refresh token, identity/quyền đã cache, theme, email đăng nhập đã lưu, bookmarks và công ty theo dõi.
  - `sessionStorage`: trạng thái portal/redirect, luồng magic link, dữ liệu tạm của một số luồng đăng ký và CV.
  - Cookie: thấy `sidebar_state` để lưu trạng thái sidebar; không thấy cookie/session dùng cho auth.

## 5. Chức năng chính của Website

- Trang chủ/landing; tìm kiếm, lọc và xem việc làm; danh sách và thông tin doanh nghiệp.
- Tài khoản ứng viên và nhà tuyển dụng: đăng nhập/đăng ký, Google, magic link, xác nhận email, quên/đặt lại mật khẩu.
- Ứng viên: hồ sơ, tạo/import/phân tích CV, gợi ý việc làm, lưu việc làm/công ty, theo dõi ứng tuyển.
- Nhà tuyển dụng: hồ sơ doanh nghiệp, quản lý tin tuyển dụng và ứng viên, quản lý nhân sự/lời mời.
- Chat, thông báo; dashboard, settings, quản trị người dùng/vai trò/quyền và kiểm duyệt.
- Có màn hình invoices và reports; reports hiện có phần hiển thị trạng thái chưa có dữ liệu.

## 6. Phụ thuộc Web được tìm thấy

- `react-dom`: có, phiên bản **19.2.8**; `react-router-dom`: không có.
- `window`/`document` và DOM API: có, gồm event listeners, `matchMedia`, `document.cookie`, cuộn trang, confirm, tạo object URL và `window.print()`.
- `localStorage`, `sessionStorage`: có; mục đích như phần Authentication bên trên. Cookie chỉ ghi nhận trạng thái sidebar.
- **iframe:** không thấy iframe tự viết; thư viện Google OAuth có phần tử iframe nội bộ.
- **Upload:** có upload avatar/CV và chọn/kéo-thả file; dùng `FormData`, xử lý PDF/DOCX qua `pdfjs-dist`/`mammoth`.
- **PDF/xuất ảnh:** có `jspdf`, `html-to-image`; CV cũng có luồng xuất/in PDF bằng browser.
- **Chart:** không thấy thư viện chart; trang reports có placeholder.
- **Map:** không thấy SDK/bản đồ; có chọn/thông tin vị trí.
- **Payment:** không thấy SDK hoặc tích hợp thanh toán; có màn hình invoices.

## 7. Khả năng dùng lại khi chuyển React Native

| Thành phần | Có thể dùng lại khi chuyển React Native? | Cần thay bằng gì? |
|---|---|---|
| TypeScript types, schemas, quy tắc nghiệp vụ và hàm xử lý dữ liệu thuần | **REUSE** | — |
| REST API contracts và phần lớn logic gọi API | **ADAPT** | Cấu hình URL/headers và cơ chế token cho môi trường mobile |
| App Router, Next.js pages và điều hướng Refine | **REPLACE** | React Navigation và cấu trúc màn hình React Native |
| Components, layout, CSS/Tailwind và UI primitives | **REWRITE** | React Native components và thư viện UI/styling mobile |
| Auth/session và browser storage | **ADAPT** | SecureStore/Keychain cho token; AsyncStorage cho dữ liệu phù hợp |
| Next.js API proxy/route handlers | **REPLACE** | Client gọi backend trực tiếp hoặc dùng một API gateway phù hợp |
| `window`, `document`, DOM và thao tác browser | **REPLACE** | API/component native tương ứng |
| Upload, đọc PDF/DOCX, tạo/in PDF | **ADAPT** | Document picker, native file APIs, PDF/share APIs |
| SignalR chat và notifications | **ADAPT** | Client/kết nối realtime tương thích React Native và lifecycle mobile |
| Google OAuth UI | **ADAPT** | Luồng OAuth native thay cho web button/iframe |

Phân tích chi tiết cú pháp React Native, Expo, thư viện hỗ trợ và lộ trình port frontend: [PHAN_TICH_REACT_NATIVE_EXPO.md](PHAN_TICH_REACT_NATIVE_EXPO.md).
