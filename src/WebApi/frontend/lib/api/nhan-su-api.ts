import { getValidToken } from "@/lib/auth-provider";

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

export type LoiMoiNhanSu = {
  email: string;
  hoTen: string;
  chucVu: string;
  tenDoanhNghiep: string;
  trangThai: string;
};

function messageOf(body: ApiResponse<unknown> | null, fallback: string): string {
  return body?.Message ?? body?.message ?? fallback;
}

function unwrap<T>(body: ApiResponse<T>, fallback: string): T {
  const succeeded = body.Succeeded ?? body.succeeded ?? true;
  const data = body.Data ?? body.data;
  if (!succeeded || data === undefined || data === null) {
    throw new Error(messageOf(body, fallback));
  }
  return data;
}

export async function getLoiMoiByToken(token: string): Promise<LoiMoiNhanSu> {
  const response = await fetch(`/api/dotnet/nhansus/invite/token?token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<Record<string, unknown>> | null;
  if (!response.ok || !body) {
    throw new Error(messageOf(body, "Không thể tải thông tin lời mời."));
  }

  const raw = unwrap(body, "Lời mời không hợp lệ.");
  return {
    email: String(raw.Email ?? raw.email ?? ""),
    hoTen: String(raw.HoTen ?? raw.hoTen ?? ""),
    chucVu: String(raw.ChucVu ?? raw.chucVu ?? ""),
    tenDoanhNghiep: String(raw.TenDoanhNghiep ?? raw.tenDoanhNghiep ?? ""),
    trangThai: String(raw.TrangThai ?? raw.trangThai ?? ""),
  };
}

export async function acceptLoiMoi(token: string): Promise<string> {
  const accessToken = await getValidToken();
  if (!accessToken) throw new Error("Bạn cần đăng nhập để chấp nhận lời mời.");

  const response = await fetch("/api/dotnet/nhansus/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ Token: token }),
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<string> | null;
  if (!response.ok || !body) {
    throw new Error(messageOf(body, "Không thể chấp nhận lời mời."));
  }

  unwrap(body, "Không thể chấp nhận lời mời.");
  return messageOf(body, "Đã chấp nhận lời mời.");
}

export type LoiMoiPending = {
  id: number;
  email: string;
  hoTen: string;
  chucVu: string;
  token: string;
  ngayHetHan: string;
  inviteLink: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const accessToken = await getValidToken();
  if (!accessToken) throw new Error("Bạn cần đăng nhập.");
  return { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
}

function mapPending(raw: Record<string, unknown>): LoiMoiPending {
  return {
    id: Number(raw.Id ?? raw.id ?? 0),
    email: String(raw.Email ?? raw.email ?? ""),
    hoTen: String(raw.HoTen ?? raw.hoTen ?? ""),
    chucVu: String(raw.ChucVu ?? raw.chucVu ?? ""),
    token: String(raw.Token ?? raw.token ?? ""),
    ngayHetHan: String(raw.NgayHetHan ?? raw.ngayHetHan ?? ""),
    inviteLink: String(raw.InviteLink ?? raw.inviteLink ?? ""),
  };
}

export async function getPendingLoiMoi(): Promise<LoiMoiPending[]> {
  const headers = await authHeaders();
  const response = await fetch("/api/dotnet/nhansus/invites/pending", { headers, cache: "no-store" });
  const body = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
  if (!response.ok || !body) throw new Error(messageOf(body, "Không thể tải lời mời đang chờ."));
  const data = unwrap<unknown>(body, "Không thể tải lời mời đang chờ.");
  const arr = Array.isArray(data) ? data : [];
  return arr.map((v) => mapPending(v as Record<string, unknown>));
}

export async function cancelLoiMoi(id: number): Promise<string> {
  const headers = await authHeaders();
  const response = await fetch(`/api/dotnet/nhansus/invite/${id}`, { method: "DELETE", headers });
  const body = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
  if (!response.ok || !body) throw new Error(messageOf(body, "Không thể hủy lời mời."));
  return messageOf(body, "Đã hủy lời mời.");
}

export async function rejectLoiMoi(token: string): Promise<string> {
  const response = await fetch("/api/dotnet/nhansus/invite/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Token: token }),
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
  if (!response.ok || !body) throw new Error(messageOf(body, "Không thể từ chối lời mời."));
  return messageOf(body, "Bạn đã từ chối lời mời.");
}
