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

Giá trị URL là prefix của API; ứng dụng nối thêm `tintuyendungs` để gọi danh sách/chi tiết. Có thể trỏ trực tiếp vào API .NET (prefix `/api`) hoặc Next.js proxy đã deploy (prefix `/api/dotnet`). Không đặt secret trong biến `EXPO_PUBLIC_*`.

Với Docker Compose local hiện tại, `docker compose ps` cho thấy frontend publish ở cổng `3000`; Android Emulator dùng `http://10.0.2.2:3000/api/dotnet`. Nếu cổng khác, thay `3000` bằng cổng host đang hiển thị trong `docker compose ps`. Điện thoại thật dùng IPv4 của máy tính thay cho `10.0.2.2`.

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
├── app/                 # Expo Router: tab Việc làm/Đã lưu/Hồ sơ và chi tiết việc làm
├── components/          # Thành phần native dùng chung và thanh điều hướng
├── features/
│   ├── bookmarks/       # Danh sách việc làm đã lưu trên thiết bị
│   └── jobs/            # API, types và UI việc làm
├── services/api/        # API client dùng chung cho mobile
├── constants/           # Theme và tokens giao diện
└── hooks/               # Hooks theme
```

Luồng đang có: tìm kiếm danh sách việc làm, xem chi tiết và lưu/bỏ lưu cục bộ. Đăng nhập, ứng tuyển, upload CV, thông báo và chat sẽ được bổ sung ở các bước tiếp theo.
