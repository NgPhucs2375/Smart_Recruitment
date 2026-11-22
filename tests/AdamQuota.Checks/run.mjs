import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../src/WebApi/frontend/lib/adam-errors.ts", import.meta.url), "utf8");
const ts = require("../../src/WebApi/frontend/node_modules/typescript");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  require(name) {
    if (name === "sonner") return { toast: { error() {} } };
    throw new Error(`Unexpected import: ${name}`);
  },
});

const backendMessage = "Bạn đã dùng hết 15 lượt chat Adam hôm nay. Vui lòng quay lại sau.";
const response = `HTTP 429: ${JSON.stringify({ message: backendMessage, used: 21, limit: 15 })}`;
const parse = exports.getAdamRateLimitMessage;

assert.equal(parse({ error: new Error(response) }), backendMessage);
assert.equal(parse({ error: { message: response } }), backendMessage);
assert.equal(parse({ error: { toString: () => response } }), backendMessage);
assert.equal(parse({ error: new Error("HTTP 400: bad request") }), null);

console.log("PASS Adam quota 429 parsing (Error, object, cross-realm fallback, non-429)");
