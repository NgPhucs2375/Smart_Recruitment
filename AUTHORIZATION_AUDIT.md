# Rà role, permission và policy

## Phạm vi và mô hình hiện tại

Rà lớp bearer/session, Identity roles/RoleClaims, policy bootstrap/cache, controller
nghiệp vụ, ownership/tenant scope trong handlers, AI query tools, CV cache,
notification audiences và kiểm tra permission ở frontend. Chat đang có thay đổi
riêng trong working tree; catalog quyền hỗ trợ `chat:send` và scope chat phải dựa
trên role hiện tại, không lấy liên kết của role cũ.

Một request cần thỏa các điều kiện độc lập:

1. JWT hợp lệ, tài khoản được xác minh/active, security stamp và role nhất quán.
2. Role được phép tham gia nghiệp vụ (bốn role chuẩn của Domain).
3. Có grant resource/action hiện tại trong Identity RoleClaims.
4. Object thuộc sở hữu hoặc phạm vi tin/doanh nghiệp được phép.
5. Transition/version hợp lệ nếu thao tác thay đổi trạng thái.

`Identity.RoleClaims` là nguồn quyền thực thi. JWT/localStorage và `policy.csv`
không thay thế quyền hiện tại trong database. Frontend permission chỉ phục vụ UX.

## Lỗi xác nhận và cách sửa

| Nhóm | Vấn đề trước sửa | Thay đổi chính |
|---|---|---|
| Bootstrap | Restart nhập lại CSV và khôi phục quyền đã thu hồi | `DefaultRoles.SeedAsync` chỉ bootstrap role mới; không prune/overwrite role có sẵn |
| Policy consistency | Matrix/CRUD ghi Casbin/file trước khi DB commit; lỗi giữa chừng gây lệch nguồn quyền | Validate toàn bộ input; commit DB trước; `PermissionCache` xuất lại từ DB sau commit |
| Policy input | Action delimiter, resource sai, casing và grant trùng | `PermissionPolicy.Normalize`; unique `(RoleId, ClaimType)`; duplicate trả 409 |
| Matrix UI | Resource biến mất khi bị thu hồi hết quyền; action download/send không được quản lý đúng | Catalog ổn định; backend trả `allowedActions`; UI giữ các action hợp lệ kể cả chưa có grant |
| Role model | Có thể đổi tên/xóa role mà Domain vẫn dùng enum cũ | Không đổi tên/xóa bốn role hệ thống; không tạo role ngoài mô hình |
| Identity/domain | Role DB và domain lệch nhau; còn role lạ; domain save thất bại sau Identity update | Bearer fail-closed; `UserRoleService` thay role chuẩn và compensate khi save thất bại |
| Admin boundaries | Recruiter có grants gây hiểu nhầm cho Identity/global dashboard | Admin-only boundary ở controller/catalog; `/me` chỉ trả grants hiệu lực |
| Frontend | Admin role tự vượt qua permission trong sidebar/`canDo`; merge permission từ JWT blob cũ | Bỏ bypass và chỉ nhận permissions từ `/me` |
| CV endpoint | Multipart POST bỏ permission check; save-version dùng create cho cả update | Legacy POST enforce create; existing CV version enforce edit |
| CV ownership | Cache detail trả trước scope check; Admin bị giới hạn nhầm; recruiter đọc CV mới sửa | Check quan hệ trước cache; Admin có scope rõ; recruiter đọc submitted snapshot |
| CV download | HR có thể tải submitted version của tin do HR khác đăng cùng DN | HR phải là người đăng tin; owner dùng doanh nghiệp hiện tại |
| CV list cache | Role change có thể dùng cache scope cũ khi mở rộng list Admin | Cache key chứa role/company; Admin list và candidate list không dùng chung key |
| CV analysis | Create/update/delete thiếu owner check, có thể chuyển record sang CV khác | `ResourceAccess.EnsureCvOwnerAsync` kiểm cả CV hiện tại và CV đích |
| Reviews | Candidate list/detail xem đánh giá của người khác; update/delete thiếu reviewer scope | `ScopeReviews`; reviewer write rules; kiểm record hiện tại và đích |
| Candidate profiles | Admin detail bị chặn như HR; HR list rộng hơn detail; write thiếu role boundary | Scope Admin/candidate/owner/HR nhất quán; write chỉ owner phù hợp hoặc Admin |
| Recruiter profiles | Owner có thể thay liên kết của record ngoài scope/gán user vào DN bỏ qua invite | Non-admin không thay user/company; thêm/gỡ HR qua workflow; list/detail giới hạn DN |
| Tenant resolution | Candidate/HR mới đổi role nhận scope từ hồ sơ hoặc ownership cũ | Resolver theo role; owner từ ownership; HR từ một membership duy nhất |
| Notifications | Audience DN gồm profile role cũ; group role/company sống lâu hơn role change | Chọn recipients theo role/active/membership; push qua user groups của recipients hiện tại |
| AI tools | Tool gọi query trực tiếp nên bypass permission của controller; HR đọc toàn DN | `IPermissionService` dùng chung cho API/tools; recruiter queries scope HR-owned jobs; CV summary dùng snapshot |
| Moderation rules | Update dùng entity không tracking nên thao tác có thể không lưu | Query update dùng `AsTracking` |

## File trọng tâm

- `src/Application/Interfaces/IPermissionService.cs`
- `src/Application/Security/ResourceAccess.cs`
- `src/Infrastructure/Infrastructure.Identity/Services/PermissionService.cs`
- `src/Infrastructure/Infrastructure.Identity/Services/PermissionPolicy.cs`
- `src/Infrastructure/Infrastructure.Identity/Services/PermissionCache.cs`
- `src/Infrastructure/Infrastructure.Identity/Services/BearerSessionValidator.cs`
- `src/Infrastructure/Infrastructure.Identity/Services/UserRoleService.cs`
- `src/Infrastructure/Infrastructure.Identity/Features/RoleClaim/Commands/`
- `src/WebApi/WebApp.Server/Controllers/BaseApiController.cs`
- `src/WebApi/WebApp.Server/Agent/Adam/Tools/CvQueryTools.cs`
- `src/WebApi/WebApp.Server/Agent/Recommen-Adam/{Candidate,Recruiter}/`
- `src/WebApi/frontend/app/(protected)/permission-matrix/page.tsx`
- `src/WebApi/frontend/{lib/permissions.ts,lib/auth-provider.ts,features/admin/api.ts}`

## Migration

`20261007090000_HardenPermissionGrants`:

- Chuẩn hóa và gộp grant trùng trước khi tạo unique index.
- Xóa grants Admin-only của non-admin và quyền tự ghi review của candidate.
- Khởi tạo capability CV download một lần cho các role đã có quyền show.
- Không re-grant download mỗi lần restart.

Migration đã chạy trên PostgreSQL local Docker. Database triển khai khác cần chạy
pipeline migration thông thường. Down chỉ bỏ index, không phục hồi quyền sai hoặc
tái tạo duplicate đã gộp.

## Kiểm chứng

- `tests/Authorization.Checks`: 34 checks với handlers/models thật và InMemory,
  gồm ownership, scope, snapshot/cache, bootstrap, compensation và AI permission gate.
- `tests/Authorization.Smoke`: 37 checks với API/PostgreSQL thật, bao gồm bốn role,
  kiểm toàn bộ active role/domain consistency, HR membership, matrix, multipart,
  grant/revoke bằng cùng JWT và concurrent unique constraint.
- `tests/AuthFlows.Smoke`: auth/role-change/password/session regressions pass.
- `tests/JobApplications.Checks`: 12 checks pass.
- `tests/RecruitmentLifecycle.Checks`: 37 checks pass.
- Frontend TypeScript và ESLint các file thay đổi pass.
- Frontend contract/permission/routing checks pass.

Smoke tests phục hồi temporary grants và dọn tài khoản test. Không sử dụng InMemory
để kết luận SQL uniqueness/transaction: các phần đó được kiểm ở PostgreSQL thật.

## Quyết định và giới hạn thiết kế

- DB grants + scope hiện tại là authority; không dùng Casbin file cho quyết định API.
- Cache export lock chỉ trong process. Chạy nhiều instance nên có cache publisher
  riêng nếu cần đồng bộ file giữa nodes; quyền API vẫn đọc DB nên không phụ thuộc file.
- Identity/domain role update hiện dùng compensation giữa hai contexts, không phải
  distributed transaction. Bearer từ chối trạng thái lệch; về lâu dài có thể dùng
  shared database transaction/connection và concurrency protocol thống nhất.
- API CV theo CV id trả latest eligible application snapshot cho recruiter; nếu cần
  phân biệt nhiều lần nộp, dùng detail theo application id đã có snapshot cụ thể.
- Browser UI của matrix đã type/lint-check; bộ kiểm thử mới không thay thế một lần
  review tương tác toàn bộ UI trên browser.
