import { ShieldCheck } from "lucide-react";
import { GoogleAuthSection } from "./google-auth-section";
import { GithubLoginButton } from "./github-login-button";

interface SocialAuthSectionProps {
  mode: "login" | "register";
  onGoogleLogin: (credential: string) => void;
  onGoogleError: (message: string) => void;
  googleError?: string | null;
  disabled?: boolean;
}

export function SocialAuthSection({
  mode,
  onGoogleLogin,
  onGoogleError,
  googleError,
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
        <GithubLoginButton text={isRegister ? "Đăng ký bằng GitHub" : "Đăng nhập bằng GitHub"} />
      </div>

      <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[10px] leading-4 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3 shrink-0 text-teal" />
        {isRegister
          ? "Google sẽ tạo tài khoản ứng viên nếu email chưa tồn tại. GitHub đang chờ tích hợp OAuth phía máy chủ."
          : "HIREAI chỉ dùng thông tin xác thực để đăng nhập an toàn vào tài khoản của bạn."}
      </p>
    </section>
  );
}
