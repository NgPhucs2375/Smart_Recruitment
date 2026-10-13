"use client";

import { GithubIcon as Github } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import type { PortalKind } from "@/lib/portal-roles";

/** sessionStorage key chứa { state, portal, next } — trang callback đọc và verify. */
export const GITHUB_OAUTH_STORAGE_KEY = "hireai.github.oauth";
/** Path callback phải khớp exact với Authorization callback URL trên GitHub OAuth App. */
export const GITHUB_CALLBACK_PATH = "/auth/github/callback";

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";

interface GithubLoginButtonProps {
  text?: string;
  disabled?: boolean;
  /** Portal đang gọi nút (candidate/employer) — lưu qua sessionStorage để callback dùng khi login. */
  portal?: PortalKind;
  next?: string | null;
  onError?: (message: string) => void;
}

/**
 * GitHub login entry — Authorization Code Flow (client-side redirect).
 * Click → sinh state chống CSRF, lưu {state, portal, next} vào sessionStorage,
 * rồi điều hướng tới GitHub authorize. Trang /auth/github/callback sẽ nhận
 * ?code=, verify state và gọi backend POST /account/github-login (backend giữ
 * client_secret để đổi code → token). Client ID lấy từ env; thiếu env → báo
 * lỗi qua onError thay vì im lặng.
 */
export function GithubLoginButton({
  text = "Tiếp tục với GitHub",
  disabled = false,
  portal,
  next,
  onError,
}: GithubLoginButtonProps) {
  function handleClick() {
    if (disabled) return;

    if (!GITHUB_CLIENT_ID) {
      onError?.("Đăng nhập GitHub chưa được cấu hình (thiếu NEXT_PUBLIC_GITHUB_CLIENT_ID).");
      return;
    }

    // CSRF state: nonce ngẫu nhiên — callback verify khớp mới cho login.
    const state =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    try {
      sessionStorage.setItem(
        GITHUB_OAUTH_STORAGE_KEY,
        JSON.stringify({ state, portal, next }),
      );
    } catch {
      onError?.("Không lưu được phiên đăng nhập (trình duyệt chặn sessionStorage).");
      return;
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: `${window.location.origin}${GITHUB_CALLBACK_PATH}`,
      scope: "read:user user:email",
      state,
    });
    window.location.assign(`https://github.com/login/oauth/authorize?${params.toString()}`);
  }

  return (
    <span className="block w-full">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={handleClick}
        className="relative h-11 w-full justify-start gap-3 rounded-xl border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm"
      >
        <span className="flex size-6 items-center justify-center rounded-lg bg-[#24292f] text-white">
          <Github className="size-3.5" aria-hidden />
        </span>
        <span className="flex-1 text-center">{text}</span>
      </Button>
    </span>
  );
}
