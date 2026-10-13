"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GithubIcon as Github } from "@/components/icons/brand-icons";
import { Loader2 } from "lucide-react";
import { useAuthLogin } from "@/components/auth";
import { GITHUB_OAUTH_STORAGE_KEY } from "@/components/auth/github-login-button";
import { sanitizeNext, type PortalKind } from "@/lib/portal-roles";

interface GithubOauthBlob {
  state?: string;
  portal?: PortalKind;
  next?: string | null;
}

/** Đọc sessionStorage KHÔNG xoá — an toàn khi render 2 lần (StrictMode). */
function peekOauthBlob(): GithubOauthBlob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GITHUB_OAUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GithubOauthBlob;
  } catch {
    return null;
  }
}

/** Đọc rồi xoá — gọi 1 lần trong effect trước khi login. */
function consumeOauthBlob(): void {
  try {
    sessionStorage.removeItem(GITHUB_OAUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

/**
 * false trên server + đúng lần render hydration (getServerSnapshot) → HTML khớp
 * server; true ngay sau hydration → derive từ sessionStorage được an toàn.
 * Cùng pattern với useIdentityResolved (hooks/use-stored-identity.ts).
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function GithubCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const ghError = searchParams.get("error");
  const ghErrorDescription = searchParams.get("error_description");

  // Đọc 1 lần khi mount — giá trị ổn định qua các lần re-render (StrictMode an toàn).
  const [oauthBlob] = useState<GithubOauthBlob | null>(() => peekOauthBlob());
  // Chỉ dùng blob SAU hydration — trước đó server & client phải render giống nhau.
  const hydrated = useHydrated();
  const blob = hydrated ? oauthBlob : null;
  const portal: PortalKind | undefined =
    blob?.portal === "candidate" || blob?.portal === "employer" ? blob.portal : undefined;
  const next = sanitizeNext(blob?.next ?? null);

  const { loginWithGitHub, isPending, error } = useAuthLogin(portal, next);

  // Derive lỗi từ URL (server/client giống nhau — không gate) + blob (chỉ sau hydration).
  const urlError: string | null = ghError
    ? ghError === "access_denied"
      ? "Bạn đã hủy đăng nhập bằng GitHub."
      : ghErrorDescription || `GitHub trả về lỗi: ${ghError}`
    : !code
      ? "Thiếu mã ủy quyền từ GitHub. Vui lòng thử lại."
      : null;
  const stateError: string | null =
    hydrated && (!blob?.state || blob.state !== state)
      ? "Phiên đăng nhập GitHub không hợp lệ (state không khớp). Vui lòng thử lại."
      : null;
  const preError = urlError ?? stateError;

  const attemptedRef = useRef(false);

  useEffect(() => {
    // Chờ hydration xong (blob-derived preError đã chốt) + guard StrictMode.
    if (!hydrated || attemptedRef.current || preError || !code) return;
    attemptedRef.current = true;

    consumeOauthBlob();
    // Trao code cho backend đổi token → Refine tự redirect theo roles.
    void loginWithGitHub(code);
  }, [hydrated, preError, code, loginWithGitHub]);

  const displayError = preError ?? error;

  return (
    <Card className="w-full max-w-md rounded-2xl border-border bg-white/90 p-2 shadow-xl backdrop-blur-md">
      <CardContent className="p-8 text-center space-y-4" aria-live="polite">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#24292f] text-white">
          <Github className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold text-foreground">Đăng nhập với GitHub</h1>

        {!displayError && (
          <div className="space-y-3 py-2">
            <Loader2 className="mx-auto size-8 animate-spin text-foreground" />
            <p className="text-sm text-muted-foreground">
              {isPending ? "Đang hoàn tất đăng nhập GitHub..." : "Đang xử lý..."}
            </p>
          </div>
        )}

        {displayError && (
          <>
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-left">
              <AlertDescription className="text-xs text-red-700">{displayError}</AlertDescription>
            </Alert>
            <Link href={portal === "employer" ? "/employer/login" : "/login"} className="block">
              <Button className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover">
                Quay lại trang Đăng nhập
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function GithubCallbackPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}>
        <GithubCallbackContent />
      </Suspense>
    </div>
  );
}
