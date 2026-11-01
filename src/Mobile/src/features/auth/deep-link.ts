export type ResetLinkParams = { email?: string; token?: string };

const LINK_LIKE = /\w+:\/\//;

/**
 * Link đặt lại mật khẩu đến tay user dưới ba dạng:
 * `https://host/reset-password?email=..&token=..`, `smartrecruitment://reset-password?...`
 * hoặc token thô user tự dán từ email.
 *
 * Không dùng `new URL()`: với custom scheme nó đẩy route vào `host` và để `path` rỗng,
 * nên chỉ cắt lấy phần sau dấu `?` rồi đọc bằng URLSearchParams.
 */
export function parseResetLink(input: string | null | undefined): ResetLinkParams {
  const value = input?.trim() ?? '';
  if (!value) return {};

  const separator = value.indexOf('?');
  if (separator === -1) return LINK_LIKE.test(value) ? {} : { token: value };

  const params = new URLSearchParams(value.slice(separator + 1));
  const email = params.get('email') || undefined;
  const token = params.get('token') || undefined;
  // Link bị cắt query (mail client tự cắt) thà trả rỗng còn hơn suy đoán.
  return email || token ? { email, token } : {};
}
