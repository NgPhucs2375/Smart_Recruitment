import { GoogleLoginButton } from "@/components/google-login-button";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";

interface GoogleAuthSectionProps {
  onGoogleLogin: (credential: string) => void;
  disabled?: boolean;
  text?: string;
  description?: string;
}

export function GoogleAuthSection({
  onGoogleLogin,
  disabled = false,
  text = "Đăng nhập với Google",
  description,
}: GoogleAuthSectionProps) {
  return (
    <div className="space-y-3">
      {description && (
        <p className="text-center text-xs text-[#69727a]">{description}</p>
      )}
      <GoogleLoginButton
        onSuccess={onGoogleLogin}
        disabled={disabled}
        text={text}
      />
    </div>
  );
}
