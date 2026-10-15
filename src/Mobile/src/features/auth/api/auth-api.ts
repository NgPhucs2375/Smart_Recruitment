import { apiRequest } from '@/services/api/client';

import type { AuthSession, AuthUser } from '../types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function unwrapData(payload: unknown): unknown {
  const envelope = asRecord(payload);
  return envelope?.Data ?? envelope?.data ?? payload;
}

export const authApi = {
  /** POST account/authenticate — trả về JWT + refresh token. */
  async login(email: string, password: string): Promise<AuthSession> {
    const payload = await apiRequest<unknown>('account/authenticate', {
      method: 'POST',
      body: JSON.stringify({ Email: email, Password: password }),
    });

    const data = asRecord(unwrapData(payload));
    const accessToken = asText(data?.JWToken ?? data?.jwToken);
    if (!accessToken) {
      throw new Error(asText(data?.message ?? data?.Message) || 'Đăng nhập thất bại.');
    }

    return {
      accessToken,
      refreshToken: asText(data?.RefreshToken ?? data?.refreshToken) || null,
    };
  },

  /** GET account/me — thông tin người dùng hiện tại (kèm quyền). */
  async me(): Promise<AuthUser> {
    const payload = await apiRequest<unknown>('account/me');
    const data = asRecord(unwrapData(payload));
    if (!data) throw new Error('Không đọc được thông tin tài khoản.');

    const rawRoles = data.Roles ?? data.roles;
    return {
      id: asText(data.Uid ?? data.uid ?? data.Id ?? data.id),
      email: asText(data.Email ?? data.email),
      userName: asText(data.UserName ?? data.userName),
      fullname: asText(data.Fullname ?? data.fullname ?? data.Name ?? data.name),
      roles: Array.isArray(rawRoles) ? rawRoles.map((role) => String(role)).filter(Boolean) : [],
      avatarUrl: asText(data.AvatarUrl ?? data.avatarUrl) || undefined,
    };
  },
};
