# Smart Recruitment Mobile — hướng dẫn bàn giao và phát triển

Tài liệu này dành cho người tiếp tục phát triển ứng dụng mobile trong repository. Nội dung mô tả **code hiện có**, cách chạy, luồng dữ liệu và điểm mở rộng tiếp theo; các chức năng được đánh dấu “chưa có” không được xem là đã hoàn thành.

## 1. Tổng quan

- Ứng dụng nằm riêng tại `src/Mobile`, không dùng chung UI với Next.js.
- Framework: **React Native + Expo SDK 57**; React 19, TypeScript và Expo Router.
- Điều hướng theo file, hỗ trợ Android/iOS và web.
- Bản hiện tại có luồng xem/tìm việc, xem chi tiết, lưu việc làm cục bộ và dataset demo bật bằng env; chưa có đăng nhập mobile và ứng tuyển.
- Tài liệu nghiên cứu React Native/Expo và phương án chuyển frontend web: [`../../PHAN_TICH_REACT_NATIVE_EXPO.md`](../../PHAN_TICH_REACT_NATIVE_EXPO.md).

## 2. Cài đặt và chạy

### Điều kiện

- Node.js **22.13 trở lên** cho Expo SDK 57.
- Docker Desktop để chạy backend, database và dịch vụ phụ trợ của repository.
- Android Studio/emulator để chạy Android. iOS Simulator cần macOS/Xcode; Windows có thể dùng thiết bị iOS/Expo development build phù hợp.

### Chạy backend/frontend local

Từ thư mục gốc repository:

```powershell
docker compose up -d --build backend frontend
docker compose ps
```

Compose sẽ tự khởi động các dependency cần thiết. Service được đặt tên `minio` để backend giữ nguyên cấu hình MinIO SDK, nhưng **image local hiện là RustFS**, một dịch vụ object storage tương thích S3. Service `minio-init` đợi storage sẵn sàng và tạo bucket cấu hình nếu chưa có.

Kiểm tra backend:

```powershell
curl.exe http://localhost:8000/health/ready
```

Mở web frontend theo cổng hiển thị trong cột `PORTS` của `docker compose ps`. Cổng host có thể khác giữa các máy do file `.env` local.

### Cấu hình mobile API

Tại `src/Mobile`, nếu chưa có file `.env`, tạo từ mẫu:

```powershell
Copy-Item .env.example .env
```

Đặt `EXPO_PUBLIC_API_URL` thành **prefix** API cần gọi. Với cấu hình Docker hiện tại trên Android Emulator, nếu frontend được publish ở cổng `3000`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/dotnet
```

`10.0.2.2` là địa chỉ host từ Android Emulator. Dùng cổng thực tế từ `docker compose ps`; trên điện thoại thật, thay bằng IPv4 LAN của máy phát triển. Không dùng `localhost` trên điện thoại/emulator để trỏ tới máy tính.

Có thể gọi backend trực tiếp bằng prefix `/api` nếu backend được publish và cấu hình phù hợp; mặc định nên dùng proxy Next.js `/api/dotnet`. `EXPO_PUBLIC_*` được đóng gói vào ứng dụng nên **không được đặt secret/API key** ở đây. File `.env` là cấu hình local, không commit.

Khởi chạy Expo trong `src/Mobile`:

```powershell
npx expo start -c
```

Trong terminal Expo, nhấn `a` để chạy Android Emulator, `w` để mở bản web. Thay đổi `.env` cần khởi động lại Expo.

## 3. Cấu trúc thư mục

```text
src/Mobile/
├── app.json                  # Tên app, scheme, bundle/package id, plugin và icon
├── package.json              # Scripts và dependencies
├── package-lock.json         # Lock dependencies cho npm ci/npm install
├── tsconfig.json             # TypeScript strict, Expo base config, aliases
├── eslint.config.js          # Quy tắc lint Expo
├── .env.example              # Mẫu URL API; không chứa secret
├── assets/                   # Icon, splash, favicon và ảnh
└── src/
    ├── app/                  # Expo Router routes và layouts
    ├── components/           # Component UI dùng chung
    ├── constants/            # Theme, màu và spacing
    ├── features/             # Code theo nghiệp vụ
    ├── hooks/                # Hooks theme/platform
    ├── services/api/         # HTTP client dùng chung
    ├── types/                # Khai báo TypeScript dùng chung
    └── global.css            # Style web dùng qua React Native Web
```

### `src/app` — routes và layout

| File | Route/chức năng |
|---|---|
| `src/app/_layout.tsx` | Root stack, theme provider, bookmark provider và status bar. |
| `src/app/(tabs)/_layout.tsx` | Layout nhóm tab. `(tabs)` là route group, không xuất hiện trên URL. |
| `src/app/(tabs)/index.tsx` | Màn danh sách/tìm việc; gọi `jobsApi.getJobs`. |
| `src/app/(tabs)/saved.tsx` | Danh sách việc làm đã lưu; tải chi tiết theo các ID đã lưu. |
| `src/app/(tabs)/profile.tsx` | Màn hồ sơ placeholder, hiển thị số việc đã lưu và trạng thái chưa đăng nhập. |
| `src/app/jobs/[id].tsx` | Chi tiết việc làm theo ID; có mô tả và lưu/bỏ lưu. |

Quy ước Expo Router: mỗi page là file trong `src/app`, `_layout.tsx` định nghĩa navigator. Không đặt component dùng chung hoặc API service trong `src/app`, nếu không Router có thể hiểu nhầm chúng là routes.

### `src/features` — code theo domain

- `features/jobs/types.ts`: model mobile `Job`.
- `features/jobs/api/jobs-api.ts`: lấy danh sách/chi tiết, chuẩn hóa payload backend (PascalCase/camelCase) sang `Job`.
- `features/jobs/mock-jobs.ts`: 6 việc làm mẫu và tìm kiếm cục bộ cho quá trình dựng UI; chỉ được sử dụng khi mock flag bật trong development.
- `features/jobs/components/job-card.tsx`: card việc làm và thao tác bookmark.
- `features/bookmarks/bookmark-provider.tsx`: React context quản lý ID đã lưu; persist bằng AsyncStorage key `smart-recruitment.saved-jobs.v1`.

Khi thêm domain mới (CV, auth, applications…), tạo feature riêng, ví dụ `src/features/auth/{api,components,types}`. Route nên gọi feature hook/service thay vì chứa toàn bộ logic nghiệp vụ.

### `src/services/api`

`services/api/client.ts` là HTTP boundary hiện tại. Nó:

- Đọc `EXPO_PUBLIC_API_URL` làm prefix.
- Gọi `fetch`, parse JSON, báo lỗi HTTP và lỗi envelope `Succeeded=false`.
- Trong development, `features/jobs/mock-jobs.ts` được dùng mặc định; đặt `EXPO_PUBLIC_USE_MOCK_DATA=false` để chuyển sang API thật. Mock luôn bị tắt trong production.
- Chưa đính kèm JWT, chưa có refresh flow và chưa có timeout/retry policy.

Khi hoàn thiện auth, bổ sung token vào API client tại đây bằng `Authorization: Bearer ...`; tránh rải logic token ở từng screen.

### `src/components`, theme và platform

- `components/themed-text.tsx`, `themed-view.tsx`: text/view đọc màu theo theme.
- `components/app-tabs.tsx`: native tabs Android/iOS.
- `components/app-tabs.web.tsx`: custom tabs cho web. Khi thêm tab phải cập nhật cả hai file và route tương ứng.
- `constants/theme.ts`: màu sáng/tối, font, spacing.
- `hooks/use-theme.ts` và `use-color-scheme*.ts`: truy cập theme theo platform.
- `types/styles.d.ts`: khai báo CSS cho TypeScript; `global.css` được dùng cho web.

Viết UI bằng React Native primitives (`View`, `Text`, `TextInput`, `Pressable`, `FlatList`) và `StyleSheet`; không dùng DOM như `div`, `window` hoặc Tailwind web trong màn native.

## 4. Luồng dữ liệu hiện tại

1. Màn Việc làm gọi `jobsApi.getJobs(keyword)`.
2. Nếu bật mock mode, tìm trong bộ mẫu ở `features/jobs/mock-jobs.ts`; nếu không, API client nối prefix với `tintuyendungs?_start=0&_end=20` và `_filter` nếu có từ khóa.
3. `jobs-api.ts` chuẩn hóa trường backend; card hiển thị việc làm và cho phép lưu.
4. Chọn card mở `/jobs/{id}`; màn chi tiết gọi `tintuyendungs/show/{id}`.
5. Bookmark chỉ lưu ID vào AsyncStorage trên thiết bị. Màn Đã lưu tải lại chi tiết từ API; chưa đồng bộ bookmark với tài khoản/backend.

### Tình trạng và điểm cần biết

- Luồng việc làm hiện có UI loading/error/empty và retry.
- Dataset demo có 6 việc làm Việt hóa; tìm kiếm lọc theo tiêu đề, công ty, địa điểm, kỹ năng và mô tả. Chế độ này mặc định bật khi `__DEV__`; đặt `EXPO_PUBLIC_USE_MOCK_DATA=false` để tắt.
- Khi kiểm tra API local không có JWT, request danh sách trả **401**. Mobile chưa có màn đăng nhập, nên muốn dữ liệu thật thì cần triển khai auth hoặc thống nhất endpoint public với backend.
- Hồ sơ/đăng nhập hiện là placeholder. Ứng tuyển, CV upload/import/export, chat/SignalR, push notification và deep link từ notification chưa được tích hợp.
- Compose hiện trả `/health/ready` 200 sau khi RustFS và bucket đã khởi tạo. Volume MinIO cũ `minio_data` được giữ nhưng dữ liệu trong đó chưa được migrate sang các RustFS volumes mới.

## 5. Cách mở rộng phổ biến

### Thêm tab mới

1. Tạo route, ví dụ `src/app/(tabs)/applications.tsx`.
2. Thêm trigger `applications` trong `src/components/app-tabs.tsx` và `src/components/app-tabs.web.tsx`.
3. Tách API/type/UI ứng tuyển vào `src/features/applications/`.
4. Kiểm tra cả Android và web vì thanh tab có implementation riêng.

### Thêm trang chi tiết/stack route

Tạo file route (ví dụ `src/app/companies/[id].tsx`) và nếu cần cấu hình header/presentation trong `src/app/_layout.tsx`. Dùng `useLocalSearchParams` từ `expo-router` để đọc path parameter.

### Nối đăng nhập native — ưu tiên kế tiếp

1. Đối chiếu login/refresh contracts hiện có trong `src/WebApi/frontend/lib/auth-provider.ts` và backend account endpoints.
2. Tạo feature `src/features/auth` cho types, API và state; dựng native login form bằng `TextInput`/`Pressable`.
3. Cài SecureStore bằng `npx expo install expo-secure-store`; access/refresh token không lưu trong AsyncStorage.
4. Bổ sung Bearer token và refresh handling tập trung trong `src/services/api/client.ts`.
5. Xác nhận endpoint danh sách việc làm public hay cần JWT; hiện request không token nhận 401.
6. Thêm tests/kiểm thử login, refresh, logout, app restart và lỗi 401 trên Android.

### Thêm Expo native module

Cài bằng `npx expo install <package>` để chọn version tương thích Expo SDK đang dùng. Nếu package có native code, cần development build; không chỉ dựa vào Expo Go. Cấu hình iOS/Android trong `app.json` hoặc Expo config plugin. Expo-managed app không nên tự tạo/sửa `ios/` và `android/` bằng tay trừ khi chủ động chuyển workflow.

## 6. Cấu hình API local và Docker

- `EXPO_PUBLIC_API_URL` là URL prefix, ví dụ `http://10.0.2.2:3000/api/dotnet`; mobile nối thêm endpoint khi mock mode tắt.
- Trong development, mock bật mặc định; đặt `EXPO_PUBLIC_USE_MOCK_DATA=false` để gọi backend. Mock bị vô hiệu hóa trong production bất kể giá trị biến.
- Cổng host có thể thay đổi theo `.env` ở root. Luôn xem `docker compose ps`; không lấy port từ một máy khác.
- Docker Compose local dùng service name `minio` cho backend, nhưng image là RustFS tương thích S3 do registry MinIO Quay trả 401. `minio-init` tạo bucket trước khi backend khởi động.
- `RUSTFS_UNSAFE_BYPASS_DISK_CHECK=true` chỉ dành cho môi trường Docker Desktop local; không mang cấu hình này sang production.
- Không commit `.env`, access token, API key hoặc credentials. `EXPO_PUBLIC_*` là giá trị public trong app bundle.

## 7. Kiểm tra và build

Từ `src/Mobile`:

```powershell
npx expo lint
npx tsc --noEmit
npx expo-doctor
npx expo export --platform android
npx expo export --platform web
```

Các lệnh lint, typecheck, Expo Doctor và export Android/web đã chạy qua khi dựng scaffold. Sau thay đổi Expo/native dependencies, chạy lại các lệnh phù hợp; cài dependencies bằng `npx expo install` và kiểm tra trên thiết bị/emulator thật khi dùng permission, storage hoặc lifecycle.

## 8. Tệp mẫu và tệp sinh ra

- `assets/images/icon.png`, `favicon.png`, `splash-icon.png`, Android icon files và `assets/expo.icon/` đang được `app.json` tham chiếu. Chúng hiện là branding mẫu Expo; thay bằng asset Smart Recruitment trước khi phát hành.
- Các ảnh tutorial/Expo/React và `assets/images/tabIcons/` hiện không được routes/components dùng; kiểm tra tìm kiếm tham chiếu trước khi xóa.
- `node_modules/`, `.expo/`, `dist/`, `expo-env.d.ts`, `.env` là dependency/build/local config, được ignore và không commit.
- `scripts/` và `src/components/ui/` hiện rỗng, có thể xóa nếu không dùng.
- `LICENSE` là MIT license do template Expo tạo; nhóm cần xác nhận license áp dụng cho dự án trước khi phát hành repository.
- Một số dependency từ template chưa được import trực tiếp trong `src/`: `@expo/ui`, `expo-constants`, `expo-device`, `expo-font`, `expo-glass-effect`, `expo-image`, `expo-linking`, `expo-symbols`, `expo-web-browser`. Chúng là ứng viên rà soát/gỡ để tinh gọn; kiểm tra dependency gián tiếp trước, dùng `npx expo uninstall <package>` và chạy `npx expo install --check` cùng `npx expo-doctor` sau khi chỉnh.

## 9. Liên kết trong repository

- [Docker Compose local](../../docker-compose.yml)
- API proxy Next.js: `src/WebApi/frontend/app/api/dotnet/[...path]/route.ts`
- [Auth provider web hiện tại](../../src/WebApi/frontend/lib/auth-provider.ts)

## Phụ lục: Cú pháp React Native cho developer đã biết Next.js

Điểm dễ tiếp cận là **JavaScript/TypeScript, React components, JSX, props, state, hooks và cách viết hàm xử lý dữ liệu vẫn là React**. Khác biệt chính nằm ở UI primitives, styling, điều hướng và API của thiết bị. Trong mobile app, không render HTML DOM.

### Đối chiếu nhanh

| Trong Next.js/Web | Trong React Native/Expo | Ghi chú |
|---|---|---|
| `div`, `section`, `article` | `View` | Container native; layout mặc định theo cột (`flexDirection: 'column'`). |
| `h1`, `p`, `span`, text node | `Text` | Mọi text hiển thị phải nằm bên trong `Text`, kể cả text nằm trong `View`. |
| `button` | `Pressable` hoặc `Button` | Dùng `onPress`; `Pressable` phù hợp để tạo button/card tuỳ biến. |
| `input` / `textarea` | `TextInput` | Dùng `onChangeText` để nhận string trực tiếp; bàn phím và keyboard type là API mobile. |
| `img` | `Image` từ `react-native` hoặc `expo-image` | Source thường là `require(...)` cho ảnh local hoặc `{ uri: ... }` cho ảnh mạng; style cần kích thước. |
| `.map()` để render danh sách lớn | `FlatList` | Virtualize danh sách, cung cấp `keyExtractor`, `renderItem`, empty/loading states. |
| CSS / Tailwind `className` | `StyleSheet.create` hoặc object `style` | Property dùng camelCase (`backgroundColor`); không có toàn bộ CSS web. App hiện dùng `StyleSheet` và theme trong `src/constants/theme.ts`. |
| `onClick` | `onPress` | Không có hover/mouse event tương đương trên thiết bị cảm ứng. |
| `next/link`, `useRouter` từ Next | `Link`, `router`, hooks từ `expo-router` | Route vẫn có thể khai báo bằng file, nhưng phải dùng router/runtime của Expo. |
| `localStorage` | `AsyncStorage` cho dữ liệu không nhạy cảm | Bookmark hiện lưu theo cách này. |
| Token trong browser storage | `expo-secure-store` | Cần dùng khi làm auth mobile; token không lưu trong AsyncStorage. |
| `window`, `document`, DOM APIs | Expo SDK module hoặc React Native API tương ứng | Ví dụ chọn file, chia sẻ, camera, notification cần module native phù hợp. |

Các biểu thức JSX và conditional rendering giữ nguyên, ví dụ `{isLoading ? <Text>Đang tải</Text> : <Text>Xong</Text>}`. Không chuyển nguyên CSS hay component web vào màn native.

### Ví dụ: job card web → native

Trong Next.js có thể viết card bằng semantic HTML, CSS class và `next/link`:

```tsx
<Link href={`/viec-lam/${job.id}`}>
  <article className="rounded-2xl border p-4">
    <h3>{job.title}</h3>
    <p>{job.company}</p>
  </article>
</Link>
```

Trong app này, cùng mục đích được viết bằng React Native primitives và Expo Router:

```tsx
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Job } from '@/features/jobs/types';

export function JobCard({ job }: { job: Job }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem chi tiết việc làm ${job.title}`}
      onPress={() => router.push(`/jobs/${job.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.content}>
        <Text style={styles.title}>{job.title}</Text>
        <Text>{job.company}</Text>
      </View>
      <Text style={styles.salary}>{job.salary}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '700' },
  salary: { fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.75 },
});
```

Ví dụ production đang được chia thành `src/features/jobs/components/job-card.tsx` (UI) và các route `src/app/**` (điều hướng). Nên giữ component nghiệp vụ ngoài thư mục routes để tái sử dụng và kiểm thử dễ hơn.

### Routing và layout

Routing ánh xạ một địa chỉ/đường dẫn đến một màn hình, đồng thời xác định màn hình nằm trong stack hay tab nào. **Expo Router và Next.js App Router đều dùng cấu trúc file**, nhưng Expo Router còn cấu hình navigation native: tab bar hệ điều hành, stack transition, back gesture, Android back button và deep links.

| Khái niệm | Next.js App Router | Expo Router trong app này |
|---|---|---|
| Thư mục route | `app/` | `src/app/` |
| Trang gốc | `app/page.tsx` | `src/app/(tabs)/index.tsx` |
| Trang con | `app/about/page.tsx` | `src/app/about.tsx` hoặc `src/app/about/index.tsx` |
| Dynamic route | `app/viec-lam/[id]/page.tsx` | `src/app/jobs/[id].tsx` |
| Layout | `layout.tsx` bọc React/HTML tree của nhánh route | `_layout.tsx` khai báo navigator (Stack/Tabs), providers và screen options |
| Nhóm không tạo segment | Route groups như `(marketing)` | Route groups như `(tabs)`; tên trong ngoặc không xuất hiện trên URL |
| Điều hướng | `next/link`, `next/navigation` | `Link`, `router`, `useLocalSearchParams` từ `expo-router` |
| Back | Browser history | Native stack back gesture, Android system back và `router.back()` |
| URL trên mobile | Chủ yếu là URL website | Route có thể mở bằng deep link; scheme app khai báo ở `app.json` |

Trong Expo Router, file route mặc định export một component screen; không cần `page.tsx`. Mọi file đặt trong `src/app` được coi là route trừ các file đặc biệt như `_layout.tsx`, vì vậy component, API và hooks dùng chung phải ở ngoài thư mục này.

### Cây route hiện tại

```text
src/app/
├── _layout.tsx                 # Root Stack + theme/bookmark providers
├── (tabs)/
│   ├── _layout.tsx             # Tab navigator
│   ├── index.tsx               # / — danh sách/tìm việc
│   ├── saved.tsx               # /saved
│   └── profile.tsx             # /profile
└── jobs/
    └── [id].tsx                # /jobs/:id — chi tiết việc làm
```

`src/app/_layout.tsx` là nơi đăng ký root `<Stack>` và các provider toàn app. `src/app/(tabs)/_layout.tsx` đưa ba trang vào tab navigator. Component thanh tab tách theo platform: `src/components/app-tabs.tsx` dùng native tabs Android/iOS; `src/components/app-tabs.web.tsx` dựng tab bar web. Khi thêm/bỏ tab, cập nhật cả route và hai implementation này.

### Điều hướng đến trang chi tiết

Next.js web hiện dùng URL tương tự `/viec-lam/123`:

```tsx
import Link from 'next/link';

<Link href={`/viec-lam/${job.id}`}>Xem việc làm</Link>
```

Trong app này, `JobCard` điều hướng tới `/jobs/123` bằng Expo Router:

```tsx
import { router, useLocalSearchParams } from 'expo-router';

// Từ một screen/component
router.push(`/jobs/${job.id}`);

// Bên trong src/app/jobs/[id].tsx
const { id } = useLocalSearchParams<{ id: string }>();
```

`router.push()` thêm screen vào stack để người dùng quay lại bằng nút back/gesture; `router.replace()` thay screen hiện tại, phù hợp với một số redirect sau đăng nhập. Chỉ truyền ID/query nhỏ qua route, rồi fetch dữ liệu ở screen đích — không truyền cả object việc làm trong URL.

### Khác biệt với Next.js cần nhớ

- Expo Router không làm file Next.js chạy trên thiết bị. `next/link`, `next/navigation`, Route Handlers, Server Components và Server Actions không thuộc runtime native; dùng `expo-router` và gọi API server qua HTTP.
- Màn mobile là giao diện React Native native, không phải HTML render trong Next.js. Bản web của Expo dùng React Native Web nhưng vẫn dùng cùng route source và Expo Router.
- Next.js có thể render route phía server; native app khởi tạo màn hình trong app runtime. Không đặt bí mật backend trong app/env `EXPO_PUBLIC_*`.
- Trên native, đường dẫn là cơ sở cho deep linking; khi thêm route được chia sẻ từ email/push notification, cần kiểm tra scheme/universal links và quyền truy cập khi app chưa đăng nhập.

### Styling và tương tác

- Style là object JavaScript, ví dụ `{ padding: 16, backgroundColor: '#fff' }`; giá trị số tính theo density-independent points, không phải CSS pixel.
- Flexbox có mặt nhưng khác web: mặc định `flexDirection` là `column`; không có cascade, selector, pseudo-elements, CSS grid đầy đủ hoặc Tailwind class nếu chưa cài/configure thư viện riêng.
- Dùng `SafeAreaView`/safe-area context để tránh tai thỏ và system bars; dùng `FlatList` thay vì một `ScrollView` chứa danh sách dài.
- Bổ sung `accessibilityRole`, `accessibilityLabel` cho thao tác quan trọng; kiểm thử bàn phím, focus, gesture và layout trên Android/iOS thực tế.
- Nếu một phần thực sự cần implementation web/native khác nhau, có thể tách file như `component.web.tsx` và `component.tsx`/`.native.tsx`, theo cách tab hiện đang tách.

### API và platform APIs

`fetch`, TypeScript types và hàm chuyển đổi dữ liệu thuần có thể dùng lại. Tuy nhiên, URL tương đối kiểu `/api/...` không tự trỏ tới Next.js từ ứng dụng native; dùng `EXPO_PUBLIC_API_URL` làm API prefix. `window.fetch`, `localStorage`, `sessionStorage`, `window.print()` và DOM file APIs phải thay bằng client/API phù hợp mobile. Không đưa server secret vào `EXPO_PUBLIC_*`.
