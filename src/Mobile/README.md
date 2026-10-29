# Smart Recruitment Mobile

Ứng dụng Android/iOS dùng Expo SDK 57, React Native và Expo Router. Website Next.js và backend ASP.NET Core hiện tại vẫn là các ứng dụng riêng.

Hướng dẫn bàn giao, cấu trúc thư mục, luồng dữ liệu và cách mở rộng: [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md).

## Yêu cầu

- Node.js **22.13 trở lên** theo yêu cầu của Expo SDK 57.
- Android Studio/emulator để chạy Android. iOS Simulator cần macOS và Xcode; có thể kiểm tra bằng thiết bị iOS/Expo development build theo tài liệu Expo.

## Cài đặt và chạy

```bash
cd src/Mobile
npm install
```

Tạo `.env` từ `.env.example` rồi đặt URL API có thể truy cập từ thiết bị:

```dotenv
EXPO_PUBLIC_API_URL=https://your-deployed-domain.example/api/dotnet
```

Trong development, app mặc định dùng 6 việc làm mẫu trong `src/features/jobs/mock-jobs.ts` để tìm kiếm, mở chi tiết và lưu bookmark; đơn ứng tuyển, CV, thông báo và chat nội bộ cũng có dữ liệu mock tương ứng. Nhãn `DEMO` báo rõ dữ liệu không lấy từ backend. Đặt `EXPO_PUBLIC_USE_MOCK_DATA=false` trong `.env` để gọi backend thật; mock tự tắt trong production và API việc làm hiện yêu cầu JWT. Đăng nhập luôn gọi backend để lấy JWT, kể cả khi danh sách việc làm đang ở mock mode, nên cần chạy backend/proxy trước khi đăng nhập.

Giá trị URL là prefix của API; ứng dụng nối thêm endpoint tương ứng (`tintuyendungs`, `cvungviens`, `hosoungviens`, `Notifications`…). Có thể trỏ trực tiếp vào API .NET (prefix `/api`) hoặc Next.js proxy đã deploy (prefix `/api/dotnet`). Không đặt secret trong biến `EXPO_PUBLIC_*`.

Thông báo realtime dùng SignalR tại `/api/hubs/notifications`; nếu không tự suy ra được từ `EXPO_PUBLIC_API_URL`, đặt `EXPO_PUBLIC_SIGNALR_URL`. Chat nội bộ dùng `/api/hubs/chat` và cũng suy ra từ `EXPO_PUBLIC_API_URL`. Khi hub thông báo không kết nối được, app tự chuyển sang polling mỗi 30 giây. Mock mode không mở SignalR.

Với Docker Compose local hiện tại, frontend thường publish ở cổng `3001`; Android Emulator dùng `http://10.0.2.2:3001/api/dotnet`. Luôn kiểm tra cột `PORTS` trong `docker compose ps` và thay cổng cho đúng. Điện thoại thật dùng IPv4 của máy tính thay cho `10.0.2.2`.

```bash
npx expo start
```

Trong terminal Expo, nhấn `a` chạy Android, `i` chạy iOS Simulator (macOS), hoặc `w` chạy web. Để điện thoại thật truy cập backend đang chạy cục bộ, cấu hình địa chỉ IP LAN của máy phát triển; `localhost` trên điện thoại trỏ về chính điện thoại.

## Lệnh kiểm tra

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Cấu trúc hiện tại

```text
src/
├── app/                 # Expo Router: tabs, auth, việc làm, đơn ứng tuyển, hồ sơ, CV, thông báo và chat
├── components/          # Thành phần native dùng chung, stack header và dialog
├── features/
│   ├── applications/    # API, hook và UI đơn ứng tuyển/nộp đơn nhanh
│   ├── auth/            # Đăng nhập, đăng ký, OAuth, đổi mật khẩu
│   ├── bookmarks/       # Danh sách việc làm đã lưu trên thiết bị
│   ├── chat/            # API, mock, SignalR và UI chat nội bộ cho Nhân sự/Người đại diện
│   ├── cv/              # API, hook và UI quản lý CV: danh sách, chi tiết, upload PDF/DOCX, tải xuống
│   ├── jobs/            # API, types và UI việc làm
│   ├── notifications/   # API, provider SignalR/polling và UI thông báo
│   └── profile/         # Hồ sơ ứng viên, form chỉnh sửa và ảnh đại diện
├── services/api/        # API client dùng chung cho mobile
├── constants/           # Theme và tokens giao diện
└── hooks/               # Hooks theme
```

Luồng đang có: đăng nhập/khôi phục phiên (email, Google/GitHub, quên/đổi mật khẩu), tìm kiếm và lọc danh sách việc làm (địa điểm, cấp bậc, hình thức, cách thức, lương, ngành nghề, kỹ năng), sắp xếp, phân trang, xem chi tiết, lưu/bỏ lưu cục bộ, nộp đơn nhanh, quản lý đơn ứng tuyển (lọc trạng thái, rút đơn), hồ sơ ứng viên (tạo/chỉnh sửa thông tin, chọn hoặc xoá ảnh đại diện tối đa 5MB), quản lý CV (xem danh sách/chi tiết, đặt mặc định, xoá, upload PDF/DOCX tối đa 10MB, tải bản gốc hoặc bản đã tạo), thông báo (chuông + badge, lọc chưa đọc/loại, đánh dấu đọc, xoá) và chat nội bộ (chat riêng/phòng chung, gửi tin qua SignalR, tải tin cũ). Workspace nhà tuyển dụng sẽ được bổ sung ở bước tiếp theo.

Module CV dùng thêm `expo-document-picker`, `expo-file-system` và `expo-sharing`; nếu đang chạy development build, cần build lại sau khi cài các module native này. Expo Go có thể dùng để thử nhanh nhưng nên kiểm tra lại luồng chọn/tải tệp trên thiết bị thật.

Module thông báo dùng `@microsoft/signalr` và chỉ hiển thị cho vai trò `UNG_VIEN`/`NHAN_SU`. Ứng viên mở được thông báo sang việc làm/đơn ứng tuyển; Nhân sự hiện chỉ xem, đánh dấu đọc và xoá vì workspace mobile chưa có. Đây là thông báo trong app, chưa dùng push notification của hệ điều hành.

Chat nội bộ chỉ hiển thị tab **Tin nhắn** cho `NHAN_SU`/`NGUOI_DAI_DIEN` và dùng chung hub `/api/hubs/chat`. Backend hiện chưa hỗ trợ đính kèm, sửa/xoá tin, typing, unread hay push cho chat, nên mobile không mô phỏng các tính năng này. Tab chat tự ẩn với các role khác; route vẫn kiểm tra role và chuyển về trang chủ nếu truy cập trực tiếp.
