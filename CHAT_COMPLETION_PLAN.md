# Kế hoạch hoàn thiện chat nội bộ

## 1. Phạm vi và nguyên nhân trải nghiệm cũ

Chat nội bộ dành cho `NHAN_SU` và `NGUOI_DAI_DIEN` đang thuộc cùng doanh nghiệp.
`UNG_VIEN` và `QUAN_TRI_VIEN` không mặc nhiên được đọc chat nội bộ.

Các vấn đề xác nhận qua source cũ:

- FE chỉ tạo hội thoại nhóm, không có danh bạ hoặc lựa chọn người nhận 1–1.
- Hội thoại nhóm bắt đầu trống; không có hướng dẫn mời nhân sự khi doanh nghiệp chỉ có một người.
- Tài khoản chưa gắn doanh nghiệp được trả danh sách rỗng, trong khi tạo/join bị từ chối; FE không giải thích điều kiện tham gia.
- FE so sánh ID Identity (chuỗi tài khoản) với `Message.SenderId` (ID nghiệp vụ), nên nhận diện sai tin của mình.
- Reconnect SignalR không join lại hội thoại; tải lịch sử trước khi join có thể bỏ lỡ tin mới.
- Thiết lập connection bị race khi chuyển hội thoại nhanh, và lỗi proxy upstream có thể trả HTTP 200.

Chưa có trace từ phiên tài khoản thực tế của người dùng để khẳng định lỗi nào trực tiếp gây việc không gửi được.
Thông báo lỗi theo ngữ cảnh và các kiểm tra dưới đây giúp xác định nguyên nhân khi chạy lại.

## 2. Đã triển khai

### Backend và dữ liệu

- Hai loại hội thoại: `Group` là phòng chung, mọi thành viên đủ quyền trong doanh nghiệp có thể truy cập; `Direct` chỉ hai người tham gia.
- API context trả ID nghiệp vụ và khả năng tạo/gửi; API danh bạ chỉ trả đồng nghiệp hợp lệ cùng doanh nghiệp.
- API tạo 1–1 nhận `RecipientId`, tự lấy người gửi/doanh nghiệp từ danh tính đăng nhập.
- Cặp ID tham gia được sắp xếp và có unique index theo doanh nghiệp; tạo từ hai phía mở lại cùng hội thoại, xử lý cạnh tranh insert.
- Lịch sử được phân trang bằng `beforeId`; tối đa 200 tin/request. Tin gửi giới hạn 4.000 ký tự, tên phòng 120 ký tự.
- Hội thoại Direct cũ thiếu cặp thành viên bị ẩn/từ chối truy cập; không tự chuyển thành phòng chung.

### Role / Permission / Resource policy

- **Role:** đúng vai trò nghiệp vụ và Identity, tài khoản hoạt động; không dựa riêng vào role trong JWT đã cũ.
- **Permission:** `chat:list`, `chat:show`, `chat:create`, `chat:send`, đọc từ DB tại thời điểm thao tác.
- **Resource policy:** thuộc doanh nghiệp hiện tại; phòng riêng bắt buộc nằm trong cặp tham gia và người còn lại vẫn hợp lệ.
- Kiểm tra session stamp, thời hạn token, email xác minh, lockout; Hub lấy người gọi từ `Context.User`.
- REST list/history/create, Hub join/send và từng người nhận realtime đều kiểm tra quyền hiện tại.
- Subscription đang tồn tại không được xem là bằng chứng có quyền; mất quyền thì không nhận nội dung mới, subscription bị loại bỏ.
- Đóng connection khi token hết hạn; cập nhật permission matrix và navigation cho resource chat.
- Bootstrap quyền một lần bằng migration cho role hiện có; seed CSV cho role mới. Không tự cấp lại quyền bị admin thu hồi ở mỗi lần restart.

### Frontend

- Hai mục Phòng chung / Chat riêng; tìm hội thoại, chọn đồng nghiệp và tạo phòng chung.
- Thể hiện phạm vi riêng tư, tên người gửi, trạng thái kết nối, thiếu đồng nghiệp và lỗi quyền/doanh nghiệp.
- ID người dùng lấy từ API context để nhận diện tin của mình.
- Join trước khi tải lịch sử và merge theo ID; reconnect join lại rồi đồng bộ lịch sử.
- Cleanup từng connection riêng khi đổi hội thoại, chống cập nhật từ request/connection cũ.
- ACK gửi tin được merge chống trùng, giữ nội dung nếu gửi lỗi; có nút kết nối lại.
- Tải tin cũ; cập nhật danh bạ/hội thoại khi focus và mỗi 30 giây để người nhận thấy cuộc trò chuyện mới.

## 3. Cập nhật khi triển khai

1. Deploy cả BE và FE cùng thay đổi này.
2. Hai migration phải được áp dụng:
   - Persistence: `20261007162236_AddDirectChatParticipants`.
   - Identity: `20261007163704_BootstrapChatPermissions`.
   Backend hiện có `ApplicationInitializer` chạy migration khi khởi động.
3. Kiểm tra trong permission matrix: hai role nhân sự/người đại diện có resource `chat` và các action cần thiết.
   Migration không ghi đè claim `chat` đã tồn tại, kể cả claim rỗng chủ đích.
4. FE cần `DOTNET_API_URL` trỏ đúng backend; kiểm tra `/api/dotnet/chat/context` và `/api/hubs/chat/negotiate` trả thành công.
5. Đăng nhập lại/làm mới identity để navigation nhận quyền chat mới.
6. Kiểm tra hồ sơ của tài khoản test: active, role Identity đồng nhất vai trò nghiệp vụ, thuộc doanh nghiệp; doanh nghiệp có ít nhất hai tài khoản hợp lệ để chat riêng.

## 4. Kiểm chứng và tiêu chí nghiệm thu

Automated checks: `tests/ChatAuthorization.Checks` chạy controller, access service và Hub với DB InMemory và client ghi nhận event.
Các trường hợp gồm: cùng DN ngoài cặp tham gia, khác DN, role không hợp lệ, thiếu DN, stamp/token cũ, phòng Direct legacy,
thu hồi quyền đọc/gửi, gỡ nhân sự khi đang kết nối, giả mạo subscription, mở cùng cặp từ hai phía và giới hạn nội dung.

Lệnh:

```text
dotnet run --project tests/ChatAuthorization.Checks/ChatAuthorization.Checks.csproj
npx tsc --noEmit
npx eslint "app/(protected)/tin-nhan/page.tsx" "app/(protected)/permission-matrix/page.tsx" "components/navigation/navigation-config.ts" "app/api/hubs/[...path]/route.ts"
```

Hai lệnh `npx` chạy tại `src/WebApi/frontend`.

Kết quả kiểm tra trong phiên triển khai: 35 tình huống authorization pass; TypeScript và ESLint cho các file FE sửa pass.
`dotnet ef migrations has-pending-model-changes` cho cả ApplicationDbContext và IdentityContext báo không có model change chưa được migration ghi nhận.

Nghiệm thu trên môi trường thật vẫn cần:

- [ ] PostgreSQL: hai request đồng thời từ hai người chỉ tạo một hội thoại Direct.
- [ ] Hai trình duyệt: đại diện chọn nhân sự, nhân sự thấy hội thoại sau làm mới/tối đa 30 giây và trả lời được.
- [ ] Nhân sự thứ ba thấy phòng chung nhưng không thấy/đọc/join/gửi chat riêng của hai người kia.
- [ ] Đổi conversation ID / recipient ID sang DN khác bị từ chối.
- [ ] Ngắt mạng rồi nối lại: join lại đúng phòng và nhận lịch sử mới; đổi phòng nhanh không lẫn tin.
- [ ] Gỡ nhân sự/thu hồi quyền khi đang online: người mất quyền không nhận nội dung tin tiếp theo.
- [ ] Mobile, bàn phím, focus trong dialog và cuộn lịch sử không làm mất vị trí đọc.

InMemory không xác minh unique index PostgreSQL hoặc toàn bộ HTTP proxy/SignalR transport; kiểm tra trên môi trường thật là bước nghiệm thu riêng.

## 5. Giai đoạn tiếp theo theo ưu tiên

### P1 — Hoàn thiện trải nghiệm hằng ngày

- Unread/last-read, preview tin cuối và sắp xếp phòng theo hoạt động mới nhất.
- Thông báo cuộc trò chuyện mới tức thì, thay polling danh sách 30 giây.
- Tự có một phòng chung mặc định khi onboard doanh nghiệp; bảo đảm idempotent khi nhiều request đồng thời.
- Giữ vị trí cuộn khi tải tin cũ, chỉ auto-scroll khi người dùng đang ở cuối.
- Client message ID/idempotency key để tránh gửi trùng khi mất ACK sau khi BE đã lưu.
- Giới hạn tốc độ gửi/tạo phòng theo user và doanh nghiệp.

### P2 — Triển khai nhiều instance và tối ưu

- Registry hiện tại in-process: chạy một backend instance cho realtime. Trước khi scale nhiều instance, thay registry bằng subscription store phân tán
  và dùng Redis backplane/Azure SignalR; vẫn phải giữ kiểm tra quyền người nhận trên mỗi lần delivery.
- Batch danh bạ/quyền nhận để loại N+1 query; đo latency theo số người nhận và kích thước DN.
- Outbox/delivery retry và log correlation để xử lý trường hợp đã lưu tin nhưng push lỗi.
- Thêm PostgreSQL integration tests và browser E2E vào CI, gồm concurrency và reconnect qua proxy.

### P3 — Chức năng mở rộng

- Đính kèm, sửa/xóa tin, tìm kiếm, trạng thái đã đọc chỉ bổ sung cùng resource policy tương ứng.
- File download phải xác minh quyền hội thoại; sửa/xóa tin kiểm tra người gửi và quyền thao tác trên đúng tin nhắn.
- Nếu cần nhóm riêng nhiều thành viên hoặc chat ứng viên–nhà tuyển dụng, thiết kế participant model và policy riêng;
  không mở rộng phòng chung hoặc chat nội bộ thành truy cập toàn bộ tài khoản.
