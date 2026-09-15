import { GoogleLoginButton } from "@/components/google-login-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleAuthSectionProps {
  onGoogleLogin: (credential: string) => void;
  disabled?: boolean;
  text?: string;
  description?: string;
  error?: string | null;
  onError?: (message: string) => void;
}

export function GoogleAuthSection({
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
        onSuccess={onGoogleLogin}
        disabled={disabled}
        text={text}
        onError={onError}
      />
    </div>
  );
}
