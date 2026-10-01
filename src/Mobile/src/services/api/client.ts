const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.Message ?? record.detail ?? record.title;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'Chưa cấu hình API. Hãy tạo file .env từ .env.example và đặt EXPO_PUBLIC_API_URL.',
    );
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

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
