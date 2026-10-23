import { apiRequest } from '@/services/api/client';

import type {
  AuthActionResult,
  AuthSession,
  AuthUser,
  RegisterInput,
  RegisterResult,
} from '../types';

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

function readMessage(payload: unknown, fallback: string): string {
  const envelope = asRecord(payload);
  return asText(envelope?.Message ?? envelope?.message) || fallback;
}

function readSession(payload: unknown, fallback: string): AuthSession {
  const data = asRecord(unwrapData(payload));
  const accessToken = asText(data?.JWToken ?? data?.jwToken);
  if (!accessToken) {
    throw new Error(asText(data?.message ?? data?.Message) || fallback);
  }

  return {
    accessToken,
    refreshToken: asText(data?.RefreshToken ?? data?.refreshToken) || null,
  };
}

export const authApi = {
  /** POST account/authenticate — trả về JWT + refresh token. */
  async login(email: string, password: string): Promise<AuthSession> {
    const payload = await apiRequest<unknown>('account/authenticate', {
      method: 'POST',
      body: JSON.stringify({ Email: email, Password: password }),
    });

    return readSession(payload, 'Đăng nhập thất bại.');
  },

  async googleLogin(idToken: string): Promise<AuthSession> {
    const payload = await apiRequest<unknown>('account/external-login', {
      method: 'POST',
      body: JSON.stringify({ Provider: 'Google', IdToken: idToken }),
    });

    return readSession(payload, 'Đăng nhập Google thất bại.');
  },

  async githubLogin(code: string, redirectUri: string): Promise<AuthSession> {
    const payload = await apiRequest<unknown>('account/github-login', {
      method: 'POST',
      body: JSON.stringify({ Code: code, RedirectUri: redirectUri }),
    });

    return readSession(payload, 'Đăng nhập GitHub thất bại.');
  },

  async register(input: RegisterInput): Promise<RegisterResult> {
    const payload = await apiRequest<unknown>('account/register', {
      method: 'POST',
      body: JSON.stringify({
        role: input.role,
        email: input.email,
        password: input.password,
        confirmPassword: input.confirmPassword,
        hoTen: input.hoTen,
        soDienThoai: input.soDienThoai,
        userName: input.userName,
        tenDoanhNghiep: input.tenDoanhNghiep,
        diaChiDoanhNghiep: input.diaChiDoanhNghiep,
        chucVu: input.chucVu,
        maSoThue: input.maSoThue,
      }),
    });

    const data = unwrapData(payload);
    const record = asRecord(data);
    return {
      userId: typeof data === 'string' ? data : asText(record?.Id ?? record?.id),
      message: readMessage(
        payload,
        'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác minh.',
      ),
    };
  },

  async confirmEmail(userId: string, code: string): Promise<AuthActionResult> {
    const payload = await apiRequest<unknown>(
      `account/confirm-email?userId=${encodeURIComponent(userId)}&code=${encodeURIComponent(code)}`,
    );
    return {
      message: readMessage(payload, 'Email đã được xác minh. Bạn có thể đăng nhập.'),
    };
  },

  async resendVerificationEmail(email: string): Promise<AuthActionResult> {
    const payload = await apiRequest<unknown>('account/resend-verification-email', {
      method: 'POST',
      body: JSON.stringify({ Email: email }),
    });
    return {
      message: readMessage(
        payload,
        'Nếu email chưa xác minh, yêu cầu gửi lại liên kết đã được tiếp nhận.',
      ),
    };
  },

  async forgotPassword(email: string): Promise<AuthActionResult> {
    const payload = await apiRequest<unknown>('account/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ Email: email }),
    });
    return {
      message: readMessage(
        payload,
        'Nếu tài khoản tồn tại, yêu cầu gửi liên kết đặt lại mật khẩu đã được tiếp nhận.',
      ),
    };
  },

  async resetPassword(email: string, password: string, token: string): Promise<AuthActionResult> {
    const payload = await apiRequest<unknown>('account/reset-password', {
      method: 'POST',
      body: JSON.stringify({ Email: email, Password: password, Token: token }),
    });
    return {
      message: readMessage(payload, 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.'),
    };
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthActionResult> {
    const payload = await apiRequest<unknown>('account/change-password', {
      method: 'POST',
      body: JSON.stringify({
        MatKhauHienTai: currentPassword,
        MatKhauMoi: newPassword,
      }),
    });
    return {
      message: readMessage(payload, 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'),
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
