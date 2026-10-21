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

/** Đọc message từ envelope Response<T> hoặc lỗi ProblemDetails. */
function readMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  const message = asText(record?.Message ?? record?.message);
  return message || fallback;
}

export type RegisterRole = 'UNG_VIEN' | 'NGUOI_DAI_DIEN';

export type RegisterInput = {
  role: RegisterRole;
  email: string;
  password: string;
  confirmPassword: string;
  hoTen: string;
  soDienThoai: string;
  /** Bắt buộc khi role=NGUOI_DAI_DIEN */
  chucVu?: string;
  tenDoanhNghiep?: string;
  diaChiDoanhNghiep?: string;
  maSoThue?: string;
  linhVucHoatDong?: string;
  quyMoNhanSu?: string;
  website?: string;
  moTaDoanhNghiep?: string;
};

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

  /** POST account/register — đăng ký ứng viên hoặc nhà tuyển dụng. */
  async register(input: RegisterInput): Promise<string> {
    const payload = await apiRequest<unknown>('account/register', {
      method: 'POST',
      body: JSON.stringify({
        role: input.role,
        email: input.email,
        password: input.password,
        confirmPassword: input.confirmPassword,
        hoTen: input.hoTen,
        soDienThoai: input.soDienThoai,
        chucVu: input.chucVu || undefined,
        tenDoanhNghiep: input.tenDoanhNghiep || undefined,
        diaChiDoanhNghiep: input.diaChiDoanhNghiep || undefined,
        maSoThue: input.maSoThue || undefined,
        linhVucHoatDong: input.linhVucHoatDong || undefined,
        quyMoNhanSu: input.quyMoNhanSu || undefined,
        website: input.website || undefined,
        moTaDoanhNghiep: input.moTaDoanhNghiep || undefined,
      }),
    });
    return readMessage(payload, 'Đăng ký thành công.');
  },

  /** POST account/forgot-password — gửi email đặt lại mật khẩu. */
  async forgotPassword(email: string): Promise<string> {
    const payload = await apiRequest<unknown>('account/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ Email: email }),
    });
    return readMessage(
      payload,
      'Nếu tài khoản tồn tại, yêu cầu gửi liên kết đặt lại mật khẩu đã được tiếp nhận.',
    );
  },

  /** POST account/reset-password — đặt lại mật khẩu bằng token từ email. */
  async resetPassword(email: string, token: string, newPassword: string): Promise<string> {
    const payload = await apiRequest<unknown>('account/reset-password', {
      method: 'POST',
      body: JSON.stringify({ Email: email, Token: token, Password: newPassword }),
    });
    return readMessage(payload, 'Đặt lại mật khẩu thành công.');
  },

  /** POST account/change-password — đổi mật khẩu (cần đăng nhập). */
  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const payload = await apiRequest<unknown>('account/change-password', {
      method: 'POST',
      body: JSON.stringify({ MatKhauHienTai: currentPassword, MatKhauMoi: newPassword }),
    });
    return readMessage(payload, 'Đổi mật khẩu thành công.');
  },

  /** POST account/resend-verification-email */
  async resendVerificationEmail(email: string): Promise<string> {
    const payload = await apiRequest<unknown>('account/resend-verification-email', {
      method: 'POST',
      body: JSON.stringify({ Email: email }),
    });
    return readMessage(
      payload,
      'Nếu email chưa xác minh, yêu cầu gửi lại liên kết đã được tiếp nhận.',
    );
  },
};
