// Benchmark cbf-v7-idf trên 15 CV ground-truth × 75 tin [GT] qua API production.
// Nhãn suy từ tiêu đề: "[GT] {Role} - bộ {NN}.{variant}" — variant 1-3 = dương, 4-5 = nhiễu.
const BASE = "http://localhost:8000";
const PASSWORD = "123Pa$$word!";
const K = 5;

async function login(email) {
  const res = await fetch(`${BASE}/api/account/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json();
  const token = body?.Data?.JWToken ?? body?.Data?.Token ?? body?.Token;
  if (!token) throw new Error(`Login fail ${email}: ${JSON.stringify(body).slice(0, 300)}`);
  return token;
}

async function recommendations(token) {
  const res = await fetch(`${BASE}/api/ketquaphuhops/recommendations?topN=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body?.Succeeded) throw new Error(`Recs fail: ${JSON.stringify(body).slice(0, 300)}`);
  return body.Data ?? [];
}

function labelOf(title, candidateNumber) {
  const m = title.match(/bộ\s+(\d{2})\.(\d)/);
  if (!m) return null; // tin không thuộc bộ GT
  const bo = Number(m[1]);
  const variant = Number(m[2]);
  if (bo !== candidateNumber) return null; // bộ của ứng viên khác: không gán nhãn
  return variant <= 3 ? 1 : 0;
}

function dcg(gains) {
  return gains.reduce((s, g, i) => s + g / Math.log2(i + 2), 0);
}

function metricsForCandidate(items, number) {
  // Thứ tự luật: điểm giảm dần, hòa theo ID giảm dần (đúng production).
  const ruleOrder = [...items].sort((a, b) => b.DiemPhuHop - a.DiemPhuHop || b.TinTuyenDungId - a.TinTuyenDungId);
  const apiOrder = items;

  const scored = (order) => {
    const top5 = order.slice(0, K);
    const hits = top5.filter((x) => labelOf(x.TieuDe, number) === 1).length;
    return { precisionAt5: hits / K, hitAt5: hits > 0 ? 1 : 0, recallAt5: hits / 3 };
  };

  // NDCG trong bộ 5 tin đã gán nhãn (3 dương + 2 nhiễu); tin vắng mặt = điểm 0, xếp cuối.
  const boItems = [];
  for (let variant = 1; variant <= 5; variant++) {
    const title = `bộ ${String(number).padStart(2, "0")}.${variant}`;
    const found = items.find((x) => x.TieuDe.includes(title));
    boItems.push({ variant, label: variant <= 3 ? 1 : 0, score: found ? found.DiemPhuHop : 0, id: found ? found.TinTuyenDungId : -variant, present: !!found });
  }
  boItems.sort((a, b) => b.score - a.score || b.id - a.id);
  const ideal = [1, 1, 1, 0, 0];
  const ndcgBo5 = dcg(boItems.map((x) => x.label)) / dcg(ideal);
  const pBo5 = boItems.slice(0, K).filter((x) => x.label === 1).length / K;

  return {
    rule: scored(ruleOrder),
    api: scored(apiOrder),
    ndcgBo5,
    precisionBo5: pBo5,
    boPresent: boItems.filter((x) => x.present).length,
    reranked: items.some((x) => x.LyDoGoiY),
    top5Rule: ruleOrder.slice(0, K).map((x) => ({ id: x.TinTuyenDungId, t: x.TieuDe, s: +x.DiemPhuHop.toFixed(4), label: labelOf(x.TieuDe, number) })),
    boItems,
  };
}

const results = [];
for (let n = 1; n <= 15; n++) {
  const email = `gt.ungvien${String(n).padStart(2, "0")}@seed.local`;
  try {
    const token = await login(email);
    const items = await recommendations(token);
    const r = metricsForCandidate(items, n);
    results.push({ number: n, email, returned: items.length, ...r });
    console.log(`#${String(n).padStart(2, "0")} returned=${items.length} P@5(rule)=${r.rule.precisionAt5.toFixed(2)} Recall@5=${r.rule.recallAt5.toFixed(2)} NDCGbo5=${r.ndcgBo5.toFixed(4)} boPresent=${r.boPresent}/5 rerank=${r.reranked}`);
  } catch (e) {
    results.push({ number: n, email, error: String(e) });
    console.log(`#${String(n).padStart(2, "0")} ERROR ${e}`);
  }
}

const ok = results.filter((x) => !x.error);
const macro = (fn) => ok.reduce((s, x) => s + fn(x), 0) / ok.length;
const summary = {
  scorer: "cbf-v7-idf (production API, rule order = DiemPhuHop desc, Id desc)",
  candidates: ok.length,
  MACRO_rule_P5: macro((x) => x.rule.precisionAt5),
  MACRO_rule_HitRate5: macro((x) => x.rule.hitAt5),
  MACRO_rule_Recall5: macro((x) => x.rule.recallAt5),
  MACRO_api_P5: macro((x) => x.api.precisionAt5),
  MACRO_api_HitRate5: macro((x) => x.api.hitAt5),
  MACRO_NDCG_bo5: macro((x) => x.ndcgBo5),
  MACRO_P_bo5: macro((x) => x.precisionBo5),
  rerankActiveCount: ok.filter((x) => x.reranked).length,
  caveats: [
    "Nhãn dương được thiết kế khớp trước (circular by construction) — đo recall của cặp thiết kế, không phải chất lượng tuyệt đối.",
    "NDCG chỉ tính trong bộ 5 tin có nhãn tường minh (3 dương + 2 nhiễu); tin ngoài bộ không gán nhãn.",
    "Tin vắng mặt khỏi top-10 bị coi như điểm 0 khi xếp trong bộ (conservative).",
    "rule order = sắp theo DiemPhuHop; api order = thứ tự trả về thực tế (có thể đã qua DeepSeek rerank).",
  ],
};
console.log("\n=== MACRO ===");
console.log(JSON.stringify(summary, null, 2));
const { writeFileSync } = await import("node:fs");
writeFileSync("tmp/gt-benchmark-result.json", JSON.stringify({ summary, results }, null, 2));
console.log("\nSaved tmp/gt-benchmark-result.json");