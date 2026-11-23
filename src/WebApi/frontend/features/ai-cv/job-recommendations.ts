/**
 * Thẻ "việc làm cho bạn" chỉ dành cho tool xếp hạng việc làm.
 * Tool khác (get_applications, get_my_recruitment_jobs, search_jobs...) cũng trả
 * về tinTuyenDungId nhưng không kèm tieuDe/diemPhuHop — parse chung sẽ sinh thẻ
 * 0% "Tin tuyển dụng" ngay dưới câu hỏi không liên quan.
 */
const RECOMMENDATION_TOOLS = new Set(["get_job_recommendations"]);

export type JobRecommendation = {
  tinTuyenDungId: number;
  tieuDe: string;
  tenDoanhNghiep: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  diemPhuHop: number;
};

export function parseJobRecommendations(
  toolName: string,
  result: string | undefined,
): JobRecommendation[] {
  if (!RECOMMENDATION_TOOLS.has(toolName) || !result) return [];
  try {
    const parsed = JSON.parse(result) as { data?: unknown; Data?: unknown };
    const data = parsed.data ?? parsed.Data;
    if (!Array.isArray(data)) return [];

    const seenIds = new Set<number>();
    return data.flatMap((value): JobRecommendation[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const tinTuyenDungId = Number(item.tinTuyenDungId ?? item.TinTuyenDungId);
      if (!Number.isInteger(tinTuyenDungId) || tinTuyenDungId <= 0 || seenIds.has(tinTuyenDungId)) return [];

      seenIds.add(tinTuyenDungId);
      return [{
        tinTuyenDungId,
        tieuDe: String(item.tieuDe ?? item.TieuDe ?? "Tin tuyển dụng"),
        tenDoanhNghiep: String(item.tenDoanhNghiep ?? item.TenDoanhNghiep ?? "Doanh nghiệp chưa cập nhật"),
        diaDiemLamViec: String(item.diaDiemLamViec ?? item.DiaDiemLamViec ?? ""),
        luongToiThieu: Number(item.luongToiThieu ?? item.LuongToiThieu ?? 0) || 0,
        luongToiDa: Number(item.luongToiDa ?? item.LuongToiDa ?? 0) || 0,
        diemPhuHop: Number(item.diemPhuHop ?? item.DiemPhuHop ?? 0) || 0,
      }];
    });
  } catch {
    return [];
  }
}
