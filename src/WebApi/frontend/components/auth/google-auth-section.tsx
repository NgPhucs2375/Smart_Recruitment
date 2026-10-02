"use client";

import dynamic from "next/dynamic";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GoogleLoginButton = dynamic(
  () => import("@/components/google-login-button").then((module) => module.GoogleLoginButton),
  {
    ssr: false,
    loading: () => <div className="h-11 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />,
  },
);

interface GoogleAuthSectionProps {
  mode?: "login" | "register";
  onGoogleLogin: (credential: string) => void;
  disabled?: boolean;
  text?: string;
  description?: string;
  error?: string | null;
  onError?: (message: string) => void;
}

export function GoogleAuthSection({
  mode = "login",
  onGoogleLogin,
  disabled = false,
  text = "Đăng nhập với Google",
  description,
  error,
  onError,
}: GoogleAuthSectionProps) {
  return (
    <div className="space-y-2.5">
      {description && (
        <p className="text-center text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
          <AlertDescription className="text-xs text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      <GoogleLoginButton
        mode={mode}
        onSuccess={onGoogleLogin}
        disabled={disabled}
        text={text}
        onError={onError}
      />
    </div>
  );
}
