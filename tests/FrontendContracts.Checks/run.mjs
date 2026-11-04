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
