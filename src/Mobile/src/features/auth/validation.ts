export function normalizeEmail(value: string): string {
  return value.trim();
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Nhập email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Email không hợp lệ.';
  return null;
}

export function validatePhone(value: string): string | null {
  const phone = value.replace(/[^\d+]/g, '');
  if (!phone) return 'Nhập số điện thoại.';
  if (!/^\+?\d{9,15}$/.test(phone)) return 'Số điện thoại không hợp lệ.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Nhập mật khẩu.';
  if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (!confirmation) return 'Nhập lại mật khẩu.';
  if (password !== confirmation) return 'Mật khẩu xác nhận không khớp.';
  return null;
}
