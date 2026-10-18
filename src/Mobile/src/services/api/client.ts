import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

const ACCESS_TOKEN_KEY = 'smart-recruitment.access-token.v1';
const REFRESH_TOKEN_KEY = 'smart-recruitment.refresh-token.v1';

// expo-secure-store chỉ có native module trên iOS/Android; trên web bản build
// export rỗng nên setItemAsync sẽ ném TypeError ngay sau khi đăng nhập xong.
const IS_WEB = Platform.OS === 'web';

async function storageGet(key: string): Promise<string | null> {
  if (IS_WEB) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (IS_WEB) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageRemove(key: string): Promise<void> {
  if (IS_WEB) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* localStorage có thể bị chặn (private mode) — bỏ qua. */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

let unauthorizedHandler: (() => void) | null = null;

/** Đăng ký callback khi phiên đăng nhập hết hạn thật sự (không refresh được). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await storageGet(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveTokens(accessToken: string, refreshToken: string | null): Promise<void> {
  await storageSet(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await storageSet(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await storageRemove(ACCESS_TOKEN_KEY).catch(() => undefined);
  await storageRemove(REFRESH_TOKEN_KEY).catch(() => undefined);
}

/**
 * Thu hồi refresh token phía server (best-effort).
 * Dùng fetch trực tiếp, KHÔNG qua apiRequest, để tránh vòng lặp 401 → refresh
 * khi access token đã hết hạn (endpoint revoke-token là anonymous).
 */
export async function revokeRefreshToken(): Promise<void> {
  try {
    const refreshToken = await storageGet(REFRESH_TOKEN_KEY);
    if (!refreshToken || !API_BASE_URL) return;
    await fetch(`${API_BASE_URL}/account/revoke-token`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ Token: refreshToken }),
    });
  } catch {
    /* Bỏ qua lỗi (offline, timeout...) — phiên local vẫn bị xoá. */
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.Message ?? record.detail ?? record.title;
    if (typeof message === 'string' && message.trim()) return message;
    const errors = record.errors ?? record.Errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === 'string' && first.trim()) return first;
    }
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function unwrapData(payload: unknown): unknown {
  const envelope = asRecord(payload);
  return envelope?.Data ?? envelope?.data ?? payload;
}

function buildHeaders(init: RequestInit | undefined, accessToken: string | null): HeadersInit {
  const isJsonBody = typeof init?.body === 'string';
  return {
    Accept: 'application/json',
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...init?.headers,
  };
}

async function fetchFromApi(
  path: string,
  init: RequestInit | undefined,
  accessToken: string | null,
): Promise<Response> {
  const normalizedPath = path.replace(/^\/+/, '');
  return fetch(`${API_BASE_URL}/${normalizedPath}`, {
    ...init,
    headers: buildHeaders(init, accessToken),
  });
}

/** Chỉ một request refresh chạy song song; các request khác chờ chung kết quả. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokensOnce(): Promise<boolean> {
  if (!API_BASE_URL) return false;
  try {
    const refreshToken = await storageGet(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/account/refresh-token`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ Token: refreshToken }),
    });
    if (!response.ok) return false;

    const text = await response.text();
    if (!text) return false;
    const payload = JSON.parse(text) as unknown;
    if ((asRecord(payload)?.Succeeded ?? asRecord(payload)?.succeeded) === false) return false;

    const data = asRecord(unwrapData(payload));
    const accessToken = (data?.JWToken ?? data?.jwToken) as string | undefined;
    if (!accessToken || typeof accessToken !== 'string') return false;

    const nextRefreshToken = (data?.RefreshToken ?? data?.refreshToken) as string | null;
    await saveTokens(accessToken, nextRefreshToken ?? refreshToken);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokensOnce().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'Chưa cấu hình API. Hãy tạo file .env từ .env.example và đặt EXPO_PUBLIC_API_URL.',
    );
  }

  const accessToken = await getAccessToken();
  let response = await fetchFromApi(path, init, accessToken);

  if (response.status === 401 && accessToken) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      response = await fetchFromApi(path, init, await getAccessToken());
    } else {
      await clearTokens();
      unauthorizedHandler?.();
    }
  }

  const responseText = await response.text();
  let body: unknown = null;
  if (responseText) {
    try {
      body = JSON.parse(responseText) as unknown;
    } catch {
      body = responseText;
    }
  }

  if (!response.ok) {
    throw new Error(messageFromBody(body, `Yêu cầu thất bại (HTTP ${response.status}).`));
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if ((record.Succeeded ?? record.succeeded) === false) {
      throw new Error(messageFromBody(body, 'Không thể tải dữ liệu từ máy chủ.'));
    }
  }

  return body as T;
}
