/** The backend has raw view models, Response<T>, and legacy paged `_data` shapes. */
export function unwrapResponse<T = unknown>(body: unknown): T {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body as T;
  const record = body as Record<string, unknown>;
  if ((record.Succeeded ?? record.succeeded) === false) {
    const message = record.Message ?? record.message ?? "Thao tác không thành công.";
    throw Object.assign(new Error(String(message)), { statusCode: 400 });
  }
  if ("Data" in record || "data" in record) return (record.Data ?? record.data) as T;
  return body as T;
}

export function listResponse<T>(body: unknown): { data: T[]; total: number } {
  const payload = unwrapResponse(body);
  const record = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const rows = Array.isArray(payload) ? payload : record._data ?? record.Items ?? record.items ?? [];
  const outer = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const total = outer.TotalCount ?? outer.totalCount ?? outer._total ?? record.TotalCount ?? record.totalCount ?? record._total;
  return { data: Array.isArray(rows) ? rows as T[] : [], total: total == null ? (Array.isArray(rows) ? rows.length : 0) : Number(total) };
}
