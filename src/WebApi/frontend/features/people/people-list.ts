export const PEOPLE_ROLES = [
  { value: "1", label: "Quản trị viên" }, { value: "2", label: "Người đại diện" },
  { value: "3", label: "Nhân sự" }, { value: "4", label: "Ứng viên" },
];
const ROLE_NAMES = ["QUAN_TRI_VIEN", "NGUOI_DAI_DIEN", "NHAN_SU", "UNG_VIEN"];
export function roleNumber(value: unknown): number {
  const index = ROLE_NAMES.indexOf(String(value));
  return index >= 0 ? index + 1 : Number(value);
}
export function searchText(value: unknown): string {
  return String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase().trim();
}
export function matchesSearch(fields: unknown[], search: string): boolean {
  const text = fields.map(searchText).join(" ");
  return searchText(search).split(/\s+/).filter(Boolean).every(word => text.includes(word));
}
export function matchesStatus(active: boolean, locked: boolean, status: string): boolean {
  switch (status) {
    case "active": return active;
    case "inactive": return !active;
    case "locked": return locked;
    case "unlocked": return !locked;
    default: return true;
  }
}
export function peoplePage<T>(rows: T[], requestedPage: number, pageSize = 20) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(1, Math.min(requestedPage, totalPages));
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), page, totalPages };
}
