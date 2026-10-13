import manifest from "@/features/tao-cv/template-manifest.json";
import { getValidToken, refreshSession } from "@/lib/auth-provider";
import { unwrapResponse } from "@/lib/api/response-contract";

export type ThemeRecommendation = {
  slug: string; name: string; description: string; score: number; reason: string;
  warnings: string[]; industry: string; position: string; level: string; columns: number; version: string; ats: boolean;
};
export type ThemeCriteria = { ViTri?: string | null; Nganh?: string | null; CapBac?: string | null; PhongCach?: string | null; SoCot?: number | null;
  UuTienATS?: boolean; BatBuocATS?: boolean; NhanManh?: string[] | null; KyNang?: string[]; UseSavedCv?: boolean; CvUngVienId?: number };
export function parseThemeResult(raw: unknown): { items: ThemeRecommendation[]; message: string } {
  let value = raw;
  try {
    for (let i = 0; i < 4 && typeof value === "string"; i++) value = JSON.parse(value);
    const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const message = String(body.Message ?? body.message ?? "");
    if ((body.Succeeded ?? body.succeeded) === false) return { items: [], message: message || "Không thể gợi ý mẫu." };
    const data = body.Data ?? body.data ?? value;
    const items = (Array.isArray(data) ? data : []).flatMap(item => {
      if (!item || typeof item !== "object") return [];
      const r = item as Record<string, unknown>;
      const slug = String(r.Slug ?? r.slug ?? "");
      if (!Object.prototype.hasOwnProperty.call(manifest, slug)) return [];
      const render = manifest[slug as keyof typeof manifest];
      const score = Number(r.Diem ?? r.diem);
      if (!Number.isFinite(score)) return [];
      const warnings = r.CanhBao ?? r.canhBao;
      return [{ slug, name: String(r.Ten ?? r.ten ?? slug), description: String(r.MoTaNgan ?? r.moTaNgan ?? ""),
        score: Math.max(0, Math.min(1, score)), reason: String(r.LyDo ?? r.lyDo ?? ""),
        warnings: Array.isArray(warnings) ? warnings.filter((w): w is string => typeof w === "string") : [],
        industry: String(r.Nganh ?? r.nganh ?? ""), position: String(r.ViTri ?? r.viTri ?? ""), level: String(r.CapBac ?? r.capBac ?? ""),
        columns: render.columns, version: render.version, ats: Boolean(r.ThanThienATS ?? r.thanThienATS) }];
    }).filter((item, index, all) => all.findIndex(x => x.slug === item.slug) === index).slice(0, 3);
    return { items, message };
  } catch { return { items: [], message: "Kết quả gợi ý mẫu không hợp lệ." }; }
}
export async function suggestThemes(criteria: ThemeCriteria): Promise<unknown> {
  let token = await getValidToken();
  const send = () => fetch("/api/dotnet/cvthemes/suggest", { method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ ...criteria, TopN: 3 }) });
  let response = await send();
  if (response.status === 401 && await refreshSession()) { token = await getValidToken(); response = await send(); }
  const body = await response.json();
  if (!response.ok) throw new Error(body.Message ?? body.message ?? "Không thể gợi ý mẫu CV.");
  unwrapResponse(body);
  return body;
}
export async function ensureActiveTemplate(slug: string): Promise<void> {
  if (!Object.prototype.hasOwnProperty.call(manifest, slug)) throw new Error("Mẫu không có renderer hợp lệ.");
  const response = await fetch("/api/dotnet/cvthemes/active", { cache: "no-store" });
  if (!response.ok) throw new Error("Không kiểm tra được trạng thái mẫu. Hãy thử lại.");
  const data = unwrapResponse<unknown[]>(await response.json());
  if (!Array.isArray(data) || !data.some(v => { const r = v as Record<string, unknown>; return (r.Slug ?? r.slug) === slug && (r.IsActive ?? r.isActive) !== false; }))
    throw new Error("Mẫu đã bị tắt hoặc xóa. Hãy yêu cầu gợi ý lại.");
}
export const CV_APPLY_THEME_EVENT = "hireai:apply-recommended-cv-theme";
export type ApplyThemeDetail = { templateId: string; complete: (result: { success: boolean; message: string }) => void };
export function requestEditorTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve({ success: false, message: "Trình soạn chưa sẵn sàng; hãy mở CV và thử lại." }), 10000);
    window.dispatchEvent(new CustomEvent<ApplyThemeDetail>(CV_APPLY_THEME_EVENT, { detail: { templateId, complete: result => { clearTimeout(timer); resolve(result); } } }));
  });
}
