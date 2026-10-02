# Nghiên cứu React Native và Expo cho Smart Recruitment

> **Mục tiêu:** tìm hiểu cú pháp, cấu trúc ứng dụng React Native, framework Expo và các thư viện/cách tiếp cận có thể hỗ trợ chuyển frontend web hiện tại sang mobile.  
> **Ngày đối chiếu tài liệu chính thức:** 26/09/2026.  
> **Source frontend được khảo sát:** `src/WebApi/frontend`.

## 1. Kết luận nhanh

- Dự án hiện dùng **Next.js 16.3.1, React 19.2.8, TypeScript 5 và Tailwind CSS 4**. Đây là frontend web App Router, không phải code React Native.
- **React Native không tự chuyển HTML/CSS của website thành giao diện native.** JSX, TypeScript, hooks và phần lớn nghiệp vụ JavaScript có thể giữ; các thành phần DOM, CSS, routing Next.js, browser storage và thao tác browser cần adapter hoặc viết lại.
- **Expo + Expo Router** là lựa chọn phù hợp để tạo app Android/iOS riêng, quản lý routing, build và tích hợp API thiết bị.
- Nếu cần đưa code web vào app nhanh trong giai đoạn chuyển đổi, **Expo DOM Components (`'use dom'`)** cho phép chạy một số component React DOM trong WebView. Đây là cầu nối để chuyển từng phần, không tạo ra giao diện native và không làm cho nguyên các trang Next.js chạy được.
- Hướng đề xuất: **giữ website Next.js**, tạo ứng dụng Expo riêng; chia sẻ types, Zod schemas, API contracts và business logic thuần; xây lại UI mobile bằng component native. Dùng DOM Components có chọn lọc cho nội dung phụ hoặc giai đoạn chuyển tiếp.

## 2. Frontend hiện tại qua source code

### 2.1 Kiến trúc và thư viện

`src/WebApi/frontend/package.json` khai báo Next.js App Router, React, TypeScript và Tailwind CSS 4. Mã được chia theo các khu vực chính:

| Khu vực | Ví dụ trong source | Nhận xét khi chuyển mobile |
|---|---|---|
| Routes/pages | `app/`, gồm nhóm `(protected)` | Cần ánh xạ sang màn hình và layout Expo Router; file page Next không thể dùng nguyên trạng. |
| Giao diện nghiệp vụ | `features/viec-lam/`, `features/tao-cv/`, `features/ho-so/` | Có thể dùng làm tài liệu thiết kế và tách phần dữ liệu/logic; component JSX web cần port. |
| Component dùng chung | `components/ui/`, `components/layout/`, `components/cv/` | Nhiều component dựa trên DOM, `@base-ui/react`, Tailwind và event của browser; cần làm lại hoặc thay bằng thư viện native. |
| Hooks và API | `hooks/`, `lib/api/`, `lib/auth-provider.ts` | Một phần logic có thể tái dùng sau khi tách khỏi `window` và storage web. |
| API proxy | `app/api/dotnet/[...path]/route.ts`, `lib/dotnet-proxy.ts` | Đây là Next.js Route Handler phía server, không chạy trong bundle native. Có thể gọi endpoint proxy đã deploy qua HTTPS hoặc cấu hình client gọi API backend công khai. |
| Tích hợp web | `@react-oauth/google`, `html-to-image`, `jspdf`, `pdfjs-dist`, `mammoth` | Cần luồng OAuth, file và PDF tương thích mobile; không mặc định các thư viện web này chạy được trên native. |

Ví dụ `lib/api/jobs-api.ts` chứa cả **chuẩn hóa dữ liệu việc làm** (`normalizeJob`) và gọi `fetch('/api/dotnet/...')`. Nên tách normalizer/types ra phần shared, còn API base URL, token và gọi mạng được cấp từ adapter web/mobile. `features/viec-lam/types.ts`, `features/viec-lam/salary.ts`, `lib/types.ts` và các schema trong `lib/schemas.ts` là những ứng viên tốt để rà soát chia sẻ.

### 2.2 Các điểm phụ thuộc browser đã xác nhận

- `lib/auth-provider.ts` đọc/ghi access token và refresh token trong `localStorage`; một số luồng đăng nhập dùng `sessionStorage`.
- Các component như `features/viec-lam/components/job-card.tsx` dùng `next/navigation`, Tailwind class, `onClick`, `onKeyDown`, DOM accessibility attributes và `sonner`.
- `features/tao-cv/manual/manual-cv-pdf.ts` nhận `HTMLElement`, tạo `canvas`, gọi `document.createElement`, `URL.createObjectURL` và tạo link download.
- Next proxy dùng `NextRequest`/`NextResponse` và biến môi trường server `DOTNET_API_URL`.
- Tài liệu hiện trạng ở [`PHAN_TICH_FRONTEND.md`](PHAN_TICH_FRONTEND.md) đã ghi nhận upload CV, PDF/DOCX, Google OAuth, SignalR, auth và các browser API liên quan.

## 3. React Native: cú pháp và cấu trúc cơ bản

React Native vẫn dùng **React function components, JSX/TSX, props, state và hooks**. Điểm khác quan trọng là JSX biểu diễn các native view, không phải thẻ HTML. React Native ánh xạ các component cốt lõi sang view tương ứng của Android/iOS.

| Nhu cầu | Web React | React Native |
|---|---|---|
| Khối chứa | `<div>` | `<View>` |
| Văn bản | `<p>`, `<span>`, heading | `<Text>` |
| Nhập liệu | `<input>` | `<TextInput>` |
| Hình ảnh | `<img>` | `<Image>` |
| Danh sách/cuộn | DOM list / overflow | `<FlatList>` cho danh sách lớn; `<ScrollView>` cho nội dung ngắn hoặc ít phần tử |
| Bấm | `onClick` | `onPress` trên `Pressable`, `Button` hoặc component tương ứng |
| Điều hướng | `next/link`, `router.push` | `Link`/`router.push` của Expo Router |

Ví dụ TSX kiểu React Native:

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type JobCardProps = {
  title: string;
  company: string;
  onOpen: () => void;
};

export function JobCard({ title, company, onOpen }: JobCardProps) {
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.details}>
        <Text style={styles.title}>{title}</Text>
        <Text>{company}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
        onPress={() => setSaved((value) => !value)}
      >
        <Text>{saved ? 'Đã lưu' : 'Lưu'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  details: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
});
```

### Khác biệt styling và tương tác

- Style truyền qua object JavaScript, dùng camelCase như `backgroundColor`; có thể gom bằng `StyleSheet.create`. React Native hỗ trợ một tập thuộc tính theo mô hình native, không phải toàn bộ CSS.
- Layout dùng Flexbox; mặc định `flexDirection` là `column` (khác mặc định `row` thường gặp trên web). Đơn vị số thường tương ứng density-independent pixels.
- Không có cascade/selector CSS thông thường, `:hover`, pseudo-element hay DOM tree. Các class Tailwind web, CSS variables và animation CSS cần được chuyển đổi/thiết kế lại.
- Một chuỗi text phải nằm trong `<Text>`; sự kiện, focus, bàn phím, safe area, accessibility và trạng thái hệ điều hành cần kiểm thử trên thiết bị thật/emulator.
- Có thể tách phần riêng theo nền tảng bằng `Platform` hoặc file `.ios.tsx`, `.android.tsx`, `.native.tsx` khi thật sự cần khác biệt.

## 4. Expo là gì và cách dựng ứng dụng

**Expo** là framework/toolchain trên React Native, cung cấp Expo CLI, Metro, cấu hình native qua app config/config plugins, các Expo SDK modules và dịch vụ build/release EAS. Có thể thử nhanh bằng Expo Go; ứng dụng có native module hoặc yêu cầu tích hợp production nên dùng **development build**.

**Expo Router** là router file-based cho Expo/React Native và web. Các file trong `app/` là route; hỗ trợ deep link, typed routes và native navigation. Đây là lựa chọn gần nhất về mô hình file-based với Next App Router, nhưng không chia sẻ implementation Next.js nguyên xi.

Ví dụ cấu trúc ứng dụng mobile có thể bắt đầu như sau:

```text
mobile/
├── app/
│   ├── _layout.tsx          # stack/tab, providers, xử lý auth
│   ├── (auth)/login.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── index.tsx        # danh sách việc làm
│       ├── viec-lam/[id].tsx
│       ├── ho-so.tsx
│       └── cv.tsx
├── src/
│   ├── components/          # native components
│   ├── features/            # màn hình/luồng nghiệp vụ mobile
│   ├── services/            # API, auth, upload, realtime
│   └── shared/              # types, schema, logic thuần
├── assets/
├── app.json
├── eas.json
└── package.json
```

Khởi tạo và chạy thử theo Expo docs:

```bash
npx create-expo-app@latest mobile
cd mobile
npx expo start
```

Expo Router được bật sẵn trong template Expo được khuyến nghị. Thêm module bằng `npx expo install <package>` để Expo chọn phiên bản phù hợp với SDK đang dùng. SDK/React Native/React phải được nâng cấp theo ma trận tương thích của Expo; không nên copy trực tiếp package version từ frontend Next.

## 5. Thư viện và hướng tiếp cận hỗ trợ chia sẻ/chuyển đổi

| Công cụ | Mục đích | Mức độ hỗ trợ source web hiện tại |
|---|---|---|
| **Expo DOM Components** (`'use dom'`) | Chạy component React DOM bên trong WebView trong ứng dụng Expo; có thể chuyển đổi theo từng component. | **Cầu nối gần nhất để tái sử dụng nhanh UI web.** Tốt cho trang trợ giúp, nội dung rich text, màn hình phụ trong lúc port. Không phải native UI; cần tách component khỏi Next APIs/server code. Dữ liệu qua bridge phải serializable, callback async; không truyền `children`; có thêm chi phí WebView/runtime. |
| **React Native Web** | Render các component React Native trên web. Hỗ trợ chia sẻ component viết bằng `<View>`, `<Text>`… giữa web và mobile. | Hữu ích nếu xây UI mới theo native primitives rồi cần render trên web. **Không tự chuyển** component DOM/Tailwind hiện có sang React Native. Website Next cũng cần tích hợp cấu hình phù hợp. |
| **NativeWind** | Viết style cho component React Native bằng cú pháp tiện ích gần Tailwind (`className`). | Có thể giảm đổi thói quen utility class, nhưng cần thay component sang native và xác minh từng utility. Source đang dùng Tailwind CSS 4; tài liệu NativeWind stable được đối chiếu đang hướng dẫn v4 với Tailwind CSS 3, còn v5 là release candidate riêng. Không nên coi đây là bộ convert CSS tự động hoặc bê nguyên config hiện tại. |
| **Tamagui** | Bộ style/UI đa nền tảng React Native + React web, hỗ trợ dùng chung thiết kế/component và có compiler. | Phù hợp nếu chủ động xây lại design system cho cả web/mobile. Cần thay dần `@base-ui/react`, DOM primitives và style hiện tại; không chuyển tự động các component đã có. |
| **Solito** | Patterns/wrapper để chia sẻ điều hướng giữa Next.js và React Native/Expo, thường qua monorepo. | Có thể cân nhắc khi chủ đích duy trì song song Next web và Expo native với code UI chia sẻ. Tạo thêm yêu cầu về monorepo, router adapters và kiểm tra compatibility; không giúp Next pages chạy trên native. |
| **Expo SDK modules** | Native API cho file, ảnh, auth, in/chia sẻ, thông báo, v.v. | Thay thế đúng chức năng browser bằng khả năng hệ điều hành; thường cần viết adapter/UI mới. |

### Đánh giá Expo DOM Components cho dự án này

Tài liệu Expo hiện mô tả DOM Components với chỉ thị `'use dom'`; từ **SDK 56** mặc định dùng `@expo/dom-webview`, các SDK trước đó dùng `react-native-webview`. Có thể truyền props JSON và native actions bất đồng bộ. Hạn chế quan trọng: DOM component không hỗ trợ SSR/SSG bên trong native app, không nhận `children`, không thể lồng native view vào trong DOM component và state global ở native không tự chia sẻ sang JS engine của DOM.

Do frontend hiện có Next Router, `@refinedev/nextjs-router`, proxy `NextResponse`, Tailwind web và nhiều DOM API, không nên import nguyên `app/**/page.tsx` vào Expo. Nếu muốn thử DOM bridge, trước tiên tách một component thuần React DOM, không phụ thuộc Next server/router, rồi kiểm tra dependency graph trên Metro. Dùng bridge như lựa chọn chuyển tiếp có giới hạn; màn hình ứng dụng chính nên port sang `<View>`, `<Text>`, `<Pressable>` và các native controls.

### Thư viện Expo phù hợp với chức năng hiện có

| Nhu cầu của Smart Recruitment | Hướng mobile tham khảo |
|---|---|
| Điều hướng và deep links | `expo-router` (dựa trên React Navigation) |
| Access/refresh token | `expo-secure-store`; không giữ token như dữ liệu thông thường trong `AsyncStorage` |
| Google/OAuth | OAuth browser flow qua `expo-auth-session` hoặc SDK native do identity provider khuyến nghị; đăng ký scheme/redirect URI mobile riêng. `@react-oauth/google` hiện có là luồng web. |
| Chọn CV PDF/DOCX | `expo-document-picker` + `expo-file-system`; dùng URI file và `FormData`/upload service tương thích backend |
| Chọn ảnh/avatar | `expo-image-picker` |
| Tạo/in/xuất CV PDF | `expo-print` tạo PDF từ HTML hoặc in; `expo-sharing` chia sẻ file. Cần dựng lại template/layout hoặc HTML PDF riêng, không dùng trực tiếp hàm đang phụ thuộc `HTMLElement`, canvas và `html-to-image`. |
| Push notifications | `expo-notifications` (Android/iOS); cần cấu hình project/credentials và development build để kiểm thử remote push. Đây là push của hệ điều hành, không thay thế realtime chat. |
| SignalR/chat | Giữ tầng nghiệp vụ/giao thức nếu phù hợp, nhưng kiểm chứng `@microsoft/signalr` và transport trên Android/iOS, reconnect khi app background/foreground và cấu hình URL HTTPS/WSS. Thiết kế interface để thay transport nếu cần. |
| Form và validation | Zod schema thuần có thể chia sẻ; `react-hook-form` có thể dùng với RN thông qua `Controller`, nhưng các field web hiện tại phải thay bằng `TextInput`/component native. |
| Icon | Thay `lucide-react` web bằng gói tương thích React Native như `lucide-react-native` và dependency SVG phù hợp. |

## 6. Ánh xạ phần hiện có sang kiến trúc mobile

| Source hiện tại | Chiến lược |
|---|---|
| Type/interface, enum, schema Zod và hàm thuần định dạng/chuẩn hóa | **Chia sẻ** sau khi bỏ import browser, Next hoặc UI. |
| `features/viec-lam/types.ts`, `salary.ts`, logic `normalizeJob` | **Ứng viên chia sẻ** giữa web/mobile; tách `normalizeJob` khỏi client API để phụ thuộc không kéo theo `getAuthToken()`. |
| REST contracts và payload backend .NET | **Chia sẻ contract**, cấu hình host/auth theo platform. Mobile có thể gọi HTTPS API proxy Next đã triển khai hoặc API .NET được public phù hợp; không thể dựa trên relative `/api/dotnet` nếu không có base URL. |
| `app/**`, Next layouts, `next/navigation`, Refine Next router | **Viết lại navigation/screen** bằng Expo Router; tái sử dụng route map hoặc tên nghiệp vụ nếu giúp ích. |
| `components/ui/**`, feature components, Tailwind và CSS | **Thiết kế lại UI** bằng native primitives và chọn NativeWind/Tamagui/UI kit phù hợp. |
| Auth provider và local/session storage | **Tách auth logic** khỏi browser storage; dùng secure storage, deep-link callback, refresh/logout và state bootstrap mobile. |
| Route handlers/proxy Next.js | **Giữ làm BFF từ xa hoặc thay API adapter**. Những file `NextRequest`, `NextResponse`, `process.env` server-only không nằm trong app native bundle. |
| Upload/import CV và PDF | **Viết lại phần truy cập file, upload và xuất** bằng Expo modules; giữ parser/mapper thuần nếu dependency không phụ thuộc DOM. |
| SignalR notifications/chat | **Thích nghi và kiểm thử native lifecycle**; bổ sung push nếu cần báo khi app không hoạt động. |

### Kiến trúc đề xuất

```text
Next.js Web (giữ nguyên) ───────┐
                                ├── REST API / .NET backend
Expo Mobile (native UI) ────────┘
          │
          ├── Shared: types, Zod schemas, DTO mapping, business rules
          ├── Web adapter: browser storage, Next proxy, web navigation
          └── Mobile adapter: SecureStore, Expo Router, file/device APIs
```

Trong giai đoạn đầu có thể tạo Expo project cạnh `src/WebApi/frontend` (ví dụ `src/Mobile`) và một thư mục/package shared. Repository hiện chưa khai báo npm workspace ở root, nên cần chọn/cấu hình cơ chế TypeScript package/path alias riêng trước khi import chéo giữa hai ứng dụng.

## 7. Lộ trình chuyển đổi gợi ý

1. **Khởi tạo app Expo độc lập:** bật Expo Router, cấu hình app id/scheme, environment riêng cho API; chạy trên Android emulator/thiết bị. Xác nhận lựa chọn SDK và các native builds.
2. **Tạo lớp shared nhỏ:** types, schemas, DTO normalizers và business rules thuần. Tránh chia sẻ trực tiếp `auth-provider.ts`, API code đang gọi `localStorage`, `window` hoặc relative route.
3. **Làm vertical slice đầu tiên:** login/refresh/logout, danh sách việc làm, lọc, chi tiết, bookmark. Đây là luồng giúp kiểm tra routing, auth, API, component list và storage.
4. **Port luồng ứng viên:** hồ sơ, import CV qua document picker, theo dõi ứng tuyển và thông báo. Chọn phần tạo/export CV sau khi quyết định trải nghiệm PDF trên mobile.
5. **Bổ sung recruiter flows và realtime:** quản lý tin/ứng viên, chat SignalR, native push và deep link từ thông báo. Giữ trang quản trị phức tạp trên web nếu chưa có yêu cầu mobile cụ thể.
6. **Dùng DOM bridge theo danh sách allowlist:** chỉ các trang/nội dung ít tương tác cần chạy lại sớm; đo thời gian tải, bộ nhớ, UX, bridge và tương thích dependency. Thay dần bằng native screen.
7. **Kiểm thử parity và phát hành:** kiểm tra Android/iOS, kích cỡ màn hình, bàn phím, quyền file/ảnh, token refresh, mạng yếu, resume app, upload/PDF, OAuth redirect và deep links. Dùng development build cho module native/push, EAS Build cho artifact phân phối.

## 8. Khuyến nghị cuối cùng

Với source hiện có, hướng cân bằng nhất là **Expo + Expo Router cho app mobile độc lập; Next.js tiếp tục phục vụ web**. Chia sẻ nghiệp vụ và hợp đồng dữ liệu, không cố chia sẻ UI DOM hiện hữu bằng mọi giá. Dùng Expo DOM Components như một cơ chế giảm rủi ro/chuyển dần cho những vùng phù hợp; xây UI native cho các luồng cốt lõi cần trải nghiệm app và tích hợp thiết bị.

## 9. Tài liệu tham khảo chính thức

- React Native: [Core Components](https://reactnative.dev/docs/intro-react-native-components), [React Fundamentals](https://reactnative.dev/docs/intro-react), [Style](https://reactnative.dev/docs/style), [Platform-specific code](https://reactnative.dev/docs/platform-specific-code).
- Expo: [Introduction](https://docs.expo.dev/), [Expo Router](https://docs.expo.dev/router/introduction/), [Environment setup](https://docs.expo.dev/get-started/set-up-your-environment/), [DOM Components](https://docs.expo.dev/guides/dom-components/).
- Expo SDK: [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/), [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/), [Print](https://docs.expo.dev/versions/latest/sdk/print/), [Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/), [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/).
- Cross-platform libraries: [React Native Web](https://necolas.github.io/react-native-web/), [NativeWind](https://www.nativewind.dev/docs/getting-started/installation), [Tamagui](https://tamagui.dev/docs/intro/introduction), [Solito](https://solito.dev/).
