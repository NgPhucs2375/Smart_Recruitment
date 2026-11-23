import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../src/WebApi/frontend/package.json", import.meta.url));
const ts = require("typescript");
async function load(relative) {
  const source = await readFile(new URL(`../../src/WebApi/frontend/${relative}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}
const { unwrapResponse, listResponse } = await load("lib/api/response-contract.ts");
const { notificationTarget } = await load("features/notifications/notification-target.ts");
const { hasPermission } = await load("lib/permissions.ts");
const { matchesSearch, matchesStatus, peoplePage, roleNumber } = await load("features/people/people-list.ts");
assert.equal(matchesSearch(["Nguyễn Văn Đạt", "dat@example.com"], "NGUYEN dat"), true);
assert.equal(matchesSearch(["Nguyễn Văn Đạt"], "nguyen nonexistent"), false);
assert.equal(matchesSearch(["Nhân sự", "0901234567"], "090123"), true);
assert.equal(matchesSearch([null, undefined], ""), true);
assert.equal(roleNumber("NGUOI_DAI_DIEN"), 2);
assert.equal(roleNumber(4), 4);
assert.equal(matchesStatus(false, false, "inactive"), true);
assert.equal(matchesStatus(true, true, "locked"), true);
assert.equal(matchesStatus(true, false, "locked"), false);
assert.equal(peoplePage(Array.from({ length: 42 }, (_, i) => i), 3).items.length, 2);
assert.deepEqual(peoplePage([1, 2], 9), { items: [1, 2], page: 1, totalPages: 1 });
assert.deepEqual(peoplePage([], 9), { items: [], page: 1, totalPages: 1 });
console.log("PASS people search: Vietnamese accents/đ, all keywords, phone, roles, statuses and page clamping");
assert.equal(hasPermission([{ resource: "cvungviens", action: "show" }], " CVUngViens ", " SHOW "), true);
assert.equal(hasPermission([], "cvungviens", "show"), false);
assert.equal(hasPermission([null, {}, { resource: 12, action: "show" }], "cvungviens", "show"), false);
console.log("PASS canonical frontend permission checks fail closed on malformed/absent grants");
const rows = [{ Id: 1 }, { Id: 2 }];
assert.deepEqual(listResponse({ Succeeded: true, Data: rows, TotalCount: 31 }), { data: rows, total: 31 });
assert.deepEqual(listResponse({ succeeded: true, data: rows, totalCount: 31 }), { data: rows, total: 31 });
assert.deepEqual(listResponse({ Succeeded: true, Data: { _data: rows, _total: 31 } }), { data: rows, total: 31 });
assert.deepEqual(listResponse({ Items: rows, TotalCount: 31 }), { data: rows, total: 31 });
assert.deepEqual(listResponse(rows), { data: rows, total: 2 });
assert.deepEqual(listResponse({ Succeeded: true, Data: [], TotalCount: 0 }), { data: [], total: 0 });
assert.equal(unwrapResponse({ Succeeded: true, Data: 42 }), 42);
assert.throws(() => unwrapResponse({ Succeeded: false, Message: "Business failure" }), /Business failure/);
assert.throws(() => listResponse({ succeeded: false, message: "No permission" }), /No permission/);
console.log("PASS raw, PascalCase, camelCase and legacy list response contracts");
console.log("PASS HTTP-success/business-failure responses are rejected");
assert.equal(notificationTarget({ referenceType: "DonUngTuyen", jobId: 12 }, ["UNG_VIEN"]), "/viec-lam/da-ung-tuyen");
assert.equal(notificationTarget({ referenceType: "DonUngTuyen", jobId: 12 }, ["NHAN_SU"]), "/tin-tuyen-dung/12/ung-vien");
assert.equal(notificationTarget({ referenceType: "TinTuyenDung", referenceId: 23 }, ["UNG_VIEN"]), "/viec-lam/23");
assert.equal(notificationTarget({ referenceType: "TinTuyenDung", referenceId: 23 }, ["QUAN_TRI_VIEN"]), "/admin/tin-tuyen-dung");
assert.equal(notificationTarget({ referenceType: "RecommendationDigest" }, ["UNG_VIEN"]), "/viec-lam/phu-hop");
assert.equal(notificationTarget({ referenceType: "RecommendationDigest" }, ["NGUOI_DAI_DIEN"]), "/tin-tuyen-dung");
assert.equal(notificationTarget({ referenceType: "RecommendationDigest" }, ["NHAN_SU"]), "/tin-tuyen-dung");
assert.equal(notificationTarget({ referenceType: "LoiMoiNhanSu", inviteToken: "a+b /" }, ["UNG_VIEN"]), "/accept-invite?token=a%2Bb%20%2F");
assert.equal(notificationTarget({ referenceType: "LoiMoiNhanSu" }, ["UNG_VIEN"]), null);
assert.equal(notificationTarget({ referenceType: "Unknown" }, ["UNG_VIEN"]), null);
assert.equal(notificationTarget({ referenceType: "GoiYViecLamPhuHop", referenceId: 44 }, ["UNG_VIEN"]), "/viec-lam/44");
assert.equal(notificationTarget({ referenceType: "UngVienPhuHop", referenceId: 44 }, ["NHAN_SU"]), "/tin-tuyen-dung/44/ung-vien");
assert.equal(notificationTarget({ referenceType: "UngVienPhuHop", referenceId: 44 }, ["NGUOI_DAI_DIEN"]), "/tin-tuyen-dung/44/ung-vien");
assert.equal(notificationTarget({ referenceType: "UngVienPhuHop", referenceId: 44 }, ["UNG_VIEN"]), null);
console.log("PASS notification navigation matches candidate/recruiter/Admin and invitation contracts");

const memoryStore = () => {
  const values = new Map();
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
};
globalThis.window = globalThis;
globalThis.localStorage = memoryStore();
globalThis.sessionStorage = memoryStore();
const { IDENTITY_KEY, REFRESH_KEY, TOKEN_KEY, readSessionValue, removeSessionValues, saveSessionValue, sessionPersistence } = await load("lib/session-storage.ts");

// Một phiên chỉ được tồn tại ở một store: bản sót ở store kia sẽ khiến lần xoay
// token kế tiếp gửi lại refresh token đã thu hồi → backend thu hồi cả chuỗi.
saveSessionValue(TOKEN_KEY, "jwt-tab", "tab_only");
saveSessionValue(TOKEN_KEY, "jwt-keep", "persistent");
assert.equal(globalThis.localStorage.getItem(TOKEN_KEY), "jwt-keep");
assert.equal(globalThis.sessionStorage.getItem(TOKEN_KEY), null);
saveSessionValue(REFRESH_KEY, "rt-keep", "persistent");
saveSessionValue(REFRESH_KEY, "rt-tab", "tab_only");
assert.equal(globalThis.sessionStorage.getItem(REFRESH_KEY), "rt-tab");
assert.equal(globalThis.localStorage.getItem(REFRESH_KEY), null);
console.log("PASS saving a session value replaces the copy in the other store");

removeSessionValues([TOKEN_KEY]);
assert.equal(sessionPersistence(), "persistent", "login without a stored session defaults to persistent");
saveSessionValue(TOKEN_KEY, "jwt-tab", "tab_only");
assert.equal(sessionPersistence(), "tab_only");
saveSessionValue(TOKEN_KEY, "jwt-keep", "persistent");
assert.equal(sessionPersistence(), "persistent");
assert.equal(readSessionValue(TOKEN_KEY), "jwt-keep");
saveSessionValue(TOKEN_KEY, "jwt-tab", "tab_only");
assert.equal(readSessionValue(TOKEN_KEY), "jwt-tab", "a tab-only session is still readable");
console.log("PASS the session store reports and follows persistent vs tab-only mode");

saveSessionValue(IDENTITY_KEY, "{}", "persistent");
saveSessionValue(REFRESH_KEY, "rt", "persistent");
removeSessionValues([IDENTITY_KEY, REFRESH_KEY, TOKEN_KEY]);
assert.equal(globalThis.localStorage.getItem(IDENTITY_KEY), null);
assert.equal(globalThis.sessionStorage.getItem(REFRESH_KEY), null);
assert.equal(globalThis.localStorage.getItem(TOKEN_KEY), null);
const browser = globalThis.window;
globalThis.window = undefined;
assert.equal(readSessionValue(TOKEN_KEY), null, "server render reads no session");
saveSessionValue(TOKEN_KEY, "jwt", "persistent");
assert.equal(globalThis.localStorage.getItem(TOKEN_KEY), null, "server render writes nothing");
globalThis.window = browser;
console.log("PASS logout wipes both stores and server render never touches web storage");

// CV .docx kiểu TopCV là bảng hai cột (nhãn | nội dung). mammoth.convertToHtml giữ
// <table>, phần này chốt rằng mỗi hàng bảng ra đúng một dòng "ô1 | ô2" — cùng giao
// diện văn bản mà backend UploadedCvTextExtractor và prompt parse CV dựa vào.
const { flattenDocxHtml } = await load("lib/cv/docx-table-text.ts");
const cell = (inner) => `<td>${inner}</td>`;
const para = (text) => `<p>${text}</p>`;
assert.equal(
  flattenDocxHtml(`${para("THONG TIN CA NHAN")}<table><tr>${cell(para("Ho ten"))}${cell(para("Nguyen Van A"))}</tr><tr>${cell(para("Email"))}${cell(para("a@example.com"))}</tr></table>${para("HOC VAN")}`),
  "THONG TIN CA NHAN\nHo ten | Nguyen Van A\nEmail | a@example.com\nHOC VAN",
);
console.log("PASS DOCX table rows flatten to one label|value line each, in document order");
assert.equal(flattenDocxHtml(`${para("Nguyen Van A")}${para("a@example.com")}`), "Nguyen Van A\na@example.com");
console.log("PASS a CV without tables keeps the same plain lines as before");
assert.equal(
  flattenDocxHtml(`<table><tr>${cell(para("Ky nang"))}${cell(`${para("Frontend")}${para("Backend")}`)}</tr></table>`),
  "Ky nang | Frontend; Backend",
);
assert.equal(
  flattenDocxHtml(`<table><tr>${cell(para("Ky nang"))}${cell(`${para("Frontend")}<table><tr>${cell(para("React"))}${cell(para("2 nam"))}</tr></table>${para("Backend")}`)}</tr></table>`),
  "Ky nang | Frontend; React | 2 nam; Backend",
);
assert.equal(
  flattenDocxHtml(`<table><tr>${cell("Chung chi")}${cell("")}${cell("IELTS 6.5")}</tr><tr>${cell("")}${cell("")}</tr></table>`),
  "Chung chi | IELTS 6.5",
);
assert.equal(flattenDocxHtml(`<p>Ca truc</p>`), "Ca truc");
assert.equal(flattenDocxHtml(`<p>backend<br>devops</p><p><img src="a.png">text</p>`), "backend devops\ntext");
// thẻ tự đóng (dạng mammoth thật sinh ra: <br/>, <img/>) từng làm rơi module vì
// biến thẻ khai báo const rồi bị gán lại — trình duyệt báo lỗi build.
assert.equal(flattenDocxHtml(`<table><tr><td><p>Ho ten</p></td><td><p>A<img src="x.png"/>, 2026</p></td></tr></table>`), "Ho ten | A, 2026");
assert.equal(flattenDocxHtml(`<p>backend<br/>devops</p>`), "backend devops");
assert.equal(flattenDocxHtml(`<p>Ha &amp; Lim &#233; Nguyen&nbsp;Anh</p>`), "Ha & Lim é Nguyen Anh");
assert.equal(flattenDocxHtml(`<td>Loose cell text</td>`), "Loose cell text");
console.log("PASS multi-paragraph cells, nested tables, empty cells, br/img and entities follow the same contract");

// UC03 magic link: bảng MagicLinkToken chỉ lưu email/role/token, nên liên kết không
// thể mang họ tên/SĐT. Form không được hỏi những gì hệ thống không giữ, và mỗi portal
// phải có đường xin liên kết.
const fe = relative => readFile(new URL(`../../src/WebApi/frontend/${relative}`, import.meta.url), "utf8");
const [magicRegisterPage, employerLoginPage, registerMagicHook, verifyHook, authProvider, magicSchema] = await Promise.all([
  fe("app/register/page.tsx"),
  fe("app/employer/login/page.tsx"),
  fe("hooks/use-magic-link-register.ts"),
  fe("hooks/use-magic-login-verify.ts"),
  fe("lib/auth-provider.ts"),
  fe("lib/schemas.ts"),
]);
assert(!/registerMagic\("(hoTen|soDienThoai)"\)/.test(magicRegisterPage), "Magic-link register form asks only for the email");
assert(/registerMagic\("email"\)/.test(magicRegisterPage), "Magic-link register form still collects the email");
assert(!/hoTen|soDienThoai/.test(magicSchema.match(/magicLinkSchema[\s\S]*?\}\);/)[0]), "magicLinkSchema carries no profile fields");
assert(!/HoTen:/.test(authProvider.match(/export async function requestMagicLink[\s\S]*?\n}/)[0]), "requestMagicLink sends no HoTen");
assert(/purpose: "Register"/.test(registerMagicHook) && /role: data\.role/.test(registerMagicHook), "Register intent still sends email + role");
assert(/sessionStorage\.setItem\("hireai\.magic\.intent", "register"\)/.test(registerMagicHook), "Register tab records the intent for the post-login redirect");
assert(/intent === "register" \? "\/ho-so"/.test(verifyHook), "Freshly registered magic-link users land on the profile page");
assert(/sessionStorage\.removeItem\("hireai\.magic\.intent"\)/.test(verifyHook), "The register intent is cleared once it has been used");
assert(/useMagicLink\("Login", \{ portal: "employer"/.test(employerLoginPage) && /<MagicLinkForm/.test(employerLoginPage), "Employer login offers the magic-link tab");
console.log("PASS magic-link forms ask only what MagicLinkToken can carry, and both portals can request a link");

// Adam chat: chỉ tool gợi ý việc làm mới được render thẻ "việc làm cho bạn".
// get_applications trả RecruitmentApplication (có tinTuyenDungId, không có tieuDe/diemPhuHop)
// nên trước đây bị parse thành các thẻ 0% "Tin tuyển dụng" ngay dưới câu hỏi đơn ứng tuyển.
const { parseJobRecommendations } = await load("features/ai-cv/job-recommendations.ts");
const applicationsPayload = JSON.stringify({ succeeded: true, data: [
  { donUngTuyenId: 7, tinTuyenDungId: 3 },
  { donUngTuyenId: 2, tinTuyenDungId: 3 },
  { donUngTuyenId: 4, tinTuyenDungId: 11 },
] });
assert.deepEqual(parseJobRecommendations("get_applications", applicationsPayload), []);
const jobsPayload = JSON.stringify({ succeeded: true, data: [
  { tinTuyenDungId: 12, tieuDe: "Backend .NET", tenDoanhNghiep: "ACME", diaDiemLamViec: "Hà Nội", luongToiThieu: 1000, luongToiDa: 2000, diemPhuHop: 0.87 },
  { TinTuyenDungId: 12, TieuDe: "Backend .NET (trùng)", DiemPhuHop: 0.87 },
  { ThiThoai: true },
] });
const jobs = parseJobRecommendations("get_job_recommendations", jobsPayload);
assert.equal(jobs.length, 1);
assert.deepEqual(jobs[0], { tinTuyenDungId: 12, tieuDe: "Backend .NET", tenDoanhNghiep: "ACME", diaDiemLamViec: "Hà Nội", luongToiThieu: 1000, luongToiDa: 2000, diemPhuHop: 0.87 });
assert.deepEqual(parseJobRecommendations("get_job_recommendations", "not json"), []);
console.log("PASS only get_job_recommendations renders job cards; applications/dedupe/malformed payloads are ignored");

// Adam chat connect: replay event thô làm @ag-ui cộng TEXT_MESSAGE_CONTENT vào
// message cùng id đã có sẵn (lặp chữ khi stream). Restore phải phát MESSAGES_SNAPSHOT
// để hợp nhất theo id, giữ đúng bookend RUN_STARTED/RUN_FINISHED của verifyEvents.
const { buildRestoreEvents, findActiveRun, mergeMessagesById, reconstructMessages, sanitizeMessages } =
  await load("app/api/copilotkit/thread-restore.ts");
const replay = [
  { type: "RUN_STARTED", threadId: "t1", runId: "r1" },
  { type: "TEXT_MESSAGE_START", messageId: "m1" },
  { type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "Mình đã chọn được mẫu phù hợp nhất." },
  { type: "TEXT_MESSAGE_END", messageId: "m1" },
  { type: "TOOL_CALL_START", toolCallId: "call-1", toolCallName: "pick_cv_themes" },
  { type: "TOOL_CALL_ARGS", toolCallId: "call-1", delta: '{"themes":["a"]}' },
  { type: "TOOL_CALL_END", toolCallId: "call-1" },
  { type: "TOOL_CALL_RESULT", messageId: "call-1-result", toolCallId: "call-1", content: "ok" },
  { type: "RUN_FINISHED", threadId: "t1", runId: "r1" },
];
const rebuilt = reconstructMessages(replay);
assert.deepEqual(rebuilt.map(message => [message.id, message.role]), [["m1", "assistant"], ["call-1", "assistant"], ["call-1-result", "tool"]]);
assert.equal(rebuilt[0].content, "Mình đã chọn được mẫu phù hợp nhất.");
assert.equal(rebuilt[1].toolCalls[0].function.arguments, '{"themes":["a"]}');
assert.equal(rebuilt[2].content, "ok");
const clientAlreadyHas = [{ id: "m1", role: "assistant", content: "Mình đã chọn được mẫu phù hợp nhất." }];
const merged = mergeMessagesById(clientAlreadyHas, rebuilt);
assert.equal(merged.filter(message => message.id === "m1").length, 1);
assert.equal(merged[0].content, "Mình đã chọn được mẫu phù hợp nhất.");
assert.deepEqual(reconstructMessages([
  { type: "TOOL_CALL_START", toolCallId: "call-2", toolCallName: "navigateTo" },
  { type: "TOOL_CALL_RESULT", toolCallId: "call-2", content: "done" },
]).map(message => [message.id, message.role]), [["call-2", "assistant"], ["call-2-result", "tool"]]);
assert.deepEqual(sanitizeMessages([
  { id: "r", role: "reasoning", content: "think" },
  { id: "e", role: "assistant", content: "" },
  { id: "a", role: "assistant", content: "ok" },
  { id: "", role: "user", content: "x" },
]).map(message => message.id), ["a"]);
const idleRestore = buildRestoreEvents({ threadId: "t1", runId: "restore-1", state: { recruitmentJobs: [] }, messages: rebuilt });
assert.deepEqual(idleRestore.map(event => event.type), ["RUN_STARTED", "STATE_SNAPSHOT", "MESSAGES_SNAPSHOT", "RUN_FINISHED"]);
assert.deepEqual(idleRestore[0], { type: "RUN_STARTED", threadId: "t1", runId: "restore-1" });
assert.deepEqual(buildRestoreEvents({ threadId: "t1", runId: "r1", active: true, messages: rebuilt }).map(event => event.type), ["RUN_STARTED", "MESSAGES_SNAPSHOT"]);
assert.deepEqual(buildRestoreEvents({ threadId: "t1", runId: "x" }).map(event => event.type), ["RUN_STARTED", "RUN_FINISHED"]);
assert.deepEqual(findActiveRun(replay.slice(0, 4)), { active: true, runId: "r1" });
assert.equal(findActiveRun(replay).active, false);
assert.equal(findActiveRun([]).active, false);
console.log("PASS connect restore is idempotent via MESSAGES_SNAPSHOT with valid RUN bookends (no duplicated streaming text)");

