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
  // Row cv_themes có CauHinhJson (Studio) chỉ tồn tại trong DB: phải đi qua
  // hydrate để đăng ký động, và phải lọt parseThemeResult — manifest tĩnh từ
  // đây chỉ còn là fallback. ats-classic ở lại để test nhánh template hệ thống.
  const studioRow = {
    Slug: "studio-db-only", Ten: "Studio Từ DB", SoCot: 2, IsActive: true,
    DanhMuc: "creative", CapBac: "all", Tags: "Studio", ThanThienATS: false,
    CauHinhJson: JSON.stringify({ id: "studio-db-only", name: "Studio Từ DB", structure: "sidebar-left", policy: { policyApproved: true } }),
  };
  const activeRows = [studioRow, { Slug: "ats-classic", Ten: "ATS Classic", SoCot: 1, IsActive: true }];
  global.fetch = async () => new Response(JSON.stringify({ Data: activeRows }), { status: 200 });
  const { hydrateThemeRegistry } = projectRequire("./features/ai-cv/theme-recommendations.ts");
  await hydrateThemeRegistry();
  assert.ok(TEMPLATE_REGISTRY["studio-db-only"], "row DB có CauHinhJson phải được đăng ký động vào registry");
  const dbDriven = parseThemeResult(JSON.stringify({ Succeeded: true, Data: [{ Slug: "studio-db-only", Ten: "Studio Từ DB", Diem: .6, LyDo: "Model chọn theo CV" }] }));
  assert.equal(dbDriven.items.length, 1); assert.equal(dbDriven.items[0].columns, 2);
  console.log("PASS DB-driven Studio theme renders and survives parsing without a static manifest entry");
  await ensureActiveTemplate("ats-classic");
  await ensureActiveTemplate("studio-db-only");
  await assert.rejects(ensureActiveTemplate("minimal-ats"), /tắt|xóa/);
  await assert.rejects(ensureActiveTemplate("unknown"), /renderer/);
  console.log("PASS applying a stale recommendation checks current backend eligibility (DB-driven theme included)");

  // "DB là truth" kiểm bằng dữ liệu thật: 16 row cv_themes từng bị CvThemeMatcher
  // loại thầm giờ nhận CauHinhJson từ seed -> hydrateTemplateRegistry -> ThemeCanvas.
  // Bỏ qua khi Docker/postgres không chạy để suite vẫn chạy offline.
  const orphans = ["professional-split", "modern-accent", "executive-tech", "sunset-gradient", "midnight-pro",
    "pastel-studio", "aurora-mesh", "pop-art-bold", "career-timeline", "infographic-pro", "statement-header",
    "one-page-exec", "host-warm", "motion-creative", "fashion-editorial", "industrial-blueprint"];
  const sep = "\u001f"; // psql -F: đơn vị separators không xuất hiện trong JSON/UTF-8 text
  const liveRows = readLiveThemes(orphans, sep);
  if (!liveRows) console.log("SKIP live DB config check (docker/postgres không chạy)");
  else {
    assert.deepEqual(liveRows.map(r => r.Slug).sort(), [...orphans].sort(), "seed phải cấp CauHinhJson cho đủ 16 mẫu mồ côi");
    const { hydrateTemplateRegistry } = projectRequire("./features/tao-cv/template-registry.ts");
    const { resolveRenderable } = projectRequire("./features/ai-cv/theme-recommendations.ts");
    hydrateTemplateRegistry(liveRows);
    for (const row of liveRows) {
      const entry = TEMPLATE_REGISTRY[row.Slug];
      const cfg = JSON.parse(row.CauHinhJson);
      assert(entry && typeof entry.Component === "function" && entry.isStudio && entry.studioThemeId === row.Slug,
        `${row.Slug} phải vào registry bằng config DB`);
      assert.equal(entry.version, "1.0");
      assert.equal(entry.columns, row.SoCot === 2 ? 2 : 1);
      assert.equal(entry.atsFriendly, row.ThanThienATS);
      assert.equal(entry.name, (row.Ten || "").trim());
      const render = resolveRenderable(row.Slug);
      assert(render && render.columns === entry.columns, `${row.Slug} phải vượt cổng render của parseThemeResult`);
      // Cổng sanitizeCssColor: màu sai cú pháp sẽ rơi về fallback, nghĩa là config hỏng.
      assert(/^#[0-9a-f]{6}$/i.test(cfg.colors.primary), `${row.Slug} colors.primary phải là hex hợp lệ, không rơi về fallback`);
    }
    const three = parseThemeResult(JSON.stringify({ Succeeded: true, Data: liveRows.slice(0, 3).map(r => ({ Slug: r.Slug, Ten: r.Ten, Diem: .6, LyDo: "Adam chọn theo CV" })) }));
    assert.equal(three.items.length, 3, "3 mẫu DB-driven phải hiển thị được trên card gợi ý");
    console.log(`PASS 16 mẫu mồ côi trong DB thật render được: hydrate + registry entry + cổng parseThemeResult (qua ${liveRows.length} row)`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

function readLiveThemes(slugs, sep) {
  const { execFileSync } = require("node:child_process");
  const columns = ["Id", "Slug", "Ten", "MoTa", "DanhMuc", "CapBac", "Tags", "SoCot", "ThanThienATS", "IsActive", "ThuTu", "CauHinhJson"];
  const list = slugs.map(s => `'${s}'`).join(",");
  let out;
  try {
    out = execFileSync("docker", ["exec", "postgres", "psql", "-U", "postgres", "-d", "smart_recruitment_db",
      "-t", "-A", "-F", sep, "-c", `SELECT ${columns.map(c => `"${c}"`).join(",")} FROM cv_themes WHERE "IsActive" AND "Slug" IN (${list}) ORDER BY "Slug"`],
      { encoding: "utf8" }).trim();
  } catch { return null; }
  if (!out) return null;
  return out.split("\n").map(line => {
    const c = line.split(sep);
    const bool = v => v === "t";
    return { Id: Number(c[0]), Slug: c[1], Ten: c[2], MoTa: c[3], DanhMuc: c[4], CapBac: c[5], Tags: c[6],
      SoCot: Number(c[7]), ThanThienATS: bool(c[8]), IsActive: bool(c[9]), ThuTu: Number(c[10]),
      CauHinhJson: c[11] || null };
  }).filter(r => r.CauHinhJson);
}
