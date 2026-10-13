import { ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleAuthSection } from "./google-auth-section";
import { GithubLoginButton } from "./github-login-button";
import type { PortalKind } from "@/lib/portal-roles";

interface SocialAuthSectionProps {
  mode: "login" | "register";
  /** Portal của trang gọi (candidate/employer) — truyền tiếp xuống GitHub button. */
  portal?: PortalKind;
  next?: string | null;
  onGoogleLogin: (credential: string) => void;
  onGoogleError: (message: string) => void;
  googleError?: string | null;
  onGithubError?: (message: string) => void;
  githubError?: string | null;
  disabled?: boolean;
}

export function SocialAuthSection({
  mode,
  portal,
  next,
  onGoogleLogin,
  onGoogleError,
  googleError,
  onGithubError,
  githubError,
  disabled = false,
}: SocialAuthSectionProps) {
  const isRegister = mode === "register";

  return (
    <section className="mt-4 rounded-2xl border border-border/80 bg-gradient-to-b from-white to-muted/35 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {isRegister ? "Đăng ký nhanh" : "Tiếp tục nhanh"}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2.5">
        <GoogleAuthSection
          mode={mode}
          onGoogleLogin={onGoogleLogin}
          disabled={disabled}
          text={isRegister ? "Đăng ký bằng Google" : "Đăng nhập bằng Google"}
          error={googleError}
          onError={onGoogleError}
        />
        <GithubLoginButton
          text={isRegister ? "Đăng ký bằng GitHub" : "Đăng nhập bằng GitHub"}
          portal={portal}
          next={next}
          disabled={disabled}
          onError={onGithubError}
        />
        {githubError && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
            <AlertDescription className="text-xs text-red-700">{githubError}</AlertDescription>
          </Alert>
        )}
      </div>

      <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[10px] leading-4 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3 shrink-0 text-teal" />
        {isRegister
          ? "Google và GitHub sẽ tạo tài khoản ứng viên nếu email chưa tồn tại."
          : "HIREAI chỉ dùng thông tin xác thực để đăng nhập an toàn vào tài khoản của bạn."}
      </p>
    </section>
  );
}
