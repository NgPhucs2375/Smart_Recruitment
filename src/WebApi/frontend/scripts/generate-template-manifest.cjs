/**
 * Sinh template-manifest.json TỪ TEMPLATE_REGISTRY (single source of truth).
 *
 * Chạy từ src/WebApi/frontend:
 *   node scripts/generate-template-manifest.cjs
 *
 * Manifest là hợp đồng backend (Application embed làm EmbeddedResource) để
 * CvThemeMatcher biết slug nào có renderer + layout/version nào. Sửa registry
 * (thêm/xóa template) rồi chạy lại script này, KHÔNG sửa tay JSON.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const frontend = path.resolve(__dirname, "..");
const projectRequire = Module.createRequire(path.join(frontend, "package.json"));
const ts = projectRequire("typescript");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  return resolve.call(
    this,
    request.startsWith("@/") ? path.join(frontend, request.slice(2)) : request,
    parent,
    ...args,
  );
};
for (const extension of [".ts", ".tsx"]) {
  Module._extensions[extension] = (module, filename) => {
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    module._compile(code, filename);
  };
}

const { TEMPLATE_REGISTRY } = projectRequire("./features/tao-cv/template-registry.ts");

const manifest = {};
for (const slug of Object.keys(TEMPLATE_REGISTRY).sort()) {
  const meta = TEMPLATE_REGISTRY[slug];
  manifest[slug] = {
    columns: meta.columns ?? 1,
    version: meta.version ?? "1.0",
  };
}

const json = `${JSON.stringify(manifest, null, 2)}\n`;
const outPath = path.join(frontend, "features/tao-cv/template-manifest.json");
fs.writeFileSync(outPath, json);
// Application embed bản sao cục bộ (Resources/) để không reference ngược sang WebApi;
// tests/CvThemeMatching.Frontend assert 2 bản đồng bộ.
const backendCopy = path.join(frontend, "../../Application/Resources/template-manifest.json");
fs.mkdirSync(path.dirname(backendCopy), { recursive: true });
fs.writeFileSync(backendCopy, json);
console.log(`Da sinh ${outPath} va ${backendCopy} (${Object.keys(manifest).length} templates)`);
