const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

// Node < 18 không có global Response/fetch. Test cần dựng Response giả cho
// nhánh kiểm tra trạng thái mẫu (ensureActiveTemplate).
if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      return JSON.parse(this._body);
    }
  };
}
const frontend = path.resolve(__dirname, "../../src/WebApi/frontend");
const projectRequire = Module.createRequire(path.join(frontend, "package.json"));
const ts = projectRequire("typescript");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  return resolve.call(this, request.startsWith("@/") ? path.join(frontend, request.slice(2)) : request, parent, ...args);
};
for (const extension of [".ts", ".tsx"]) Module._extensions[extension] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  module._compile(code, filename);
};
const { TEMPLATE_REGISTRY } = projectRequire("./features/tao-cv/template-registry.ts");
const manifest = projectRequire("./features/tao-cv/template-manifest.json");
assert.deepEqual(Object.keys(manifest).sort(), Object.keys(TEMPLATE_REGISTRY).sort());
for (const [slug, item] of Object.entries(manifest)) {
  assert.equal(item.version, TEMPLATE_REGISTRY[slug].version);
  assert.equal(item.columns, TEMPLATE_REGISTRY[slug].columns);
}
console.log("PASS backend manifest matches every actual frontend renderer, version and layout");
const { parseThemeResult, ensureActiveTemplate } = projectRequire("./features/ai-cv/theme-recommendations.ts");
const payload = { Succeeded: true, Data: [{ Slug: "ats-classic", Ten: "ATS Classic", Diem: .8, LyDo: "Backend junior", CanhBao: ["ATS metadata"], SoCot: 2 }, { Slug: "fake", Diem: 1 }] };
const parsed = parseThemeResult(JSON.stringify(payload));
assert.equal(parsed.items.length, 1); assert.equal(parsed.items[0].columns, 1);
assert.equal(parseThemeResult({ succeeded: false, message: "Denied", data: payload.Data }).items.length, 0);
assert.equal(parseThemeResult("not-json").items.length, 0);
console.log("PASS tool parsing rejects fake renderers/business errors and uses real layout");
const { applyTemplatePatch } = projectRequire("./features/ai-cv/merge-cv-patch.ts");
const draft = { templateId: "minimal-ats", tenFile: "Unsaved", thongTinLienHe: { hoTen: "Draft name", viTriUngTuyen: "Backend junior" }, kyNang: [{ id: "s1", tenKyNang: "C#" }], kinhNghiemLamViec: [], hocVan: [], duAn: [{ id: "p1", tenDuAn: "Unsaved project" }], chungChi: [] };
const original = JSON.stringify(draft);
const change = applyTemplatePatch(draft, "ats-classic");
assert(change.applied); assert.equal(change.next.templateId, "ats-classic");
assert.equal(JSON.stringify(draft), original);
assert.deepEqual({ ...change.next, templateId: draft.templateId }, draft);
assert.equal(applyTemplatePatch(draft, "does-not-exist").applied, false);
TEMPLATE_REGISTRY["ats-classic"].isActive = false;
assert.equal(applyTemplatePatch(draft, "ats-classic").applied, false);
delete TEMPLATE_REGISTRY["ats-classic"].isActive;
console.log("PASS template apply preserves unsaved content and rejects unknown/inactive layouts");
(async () => {
  global.fetch = async () => new Response(JSON.stringify({ Data: [{ Slug: "ats-classic", IsActive: true }] }), { status: 200 });
  await ensureActiveTemplate("ats-classic");
  await assert.rejects(ensureActiveTemplate("minimal-ats"), /tắt|xóa/);
  await assert.rejects(ensureActiveTemplate("unknown"), /renderer/);
  console.log("PASS applying a stale recommendation checks current backend eligibility");
})().catch(error => { console.error(error); process.exitCode = 1; });
