"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationEmail } from "@/lib/auth-provider";

export function ResendVerification({ email, error }: { email: string; error: string | null | undefined }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  if (!error || !/xác minh|chưa.*xác thực.*email/i.test(error)) return null;
  return <div className="space-y-2 rounded-xl border border-border bg-muted p-3">
    <p className="text-xs text-muted-foreground">Xác minh email trước khi đăng nhập. Nếu chưa nhận thư, bạn có thể yêu cầu gửi lại.</p>
    <Button type="button" variant="outline" size="sm" disabled={pending || !email.trim()} onClick={async () => {
      setPending(true); setResult(null);
      try { setResult(await resendVerificationEmail(email.trim())); }
      finally { setPending(false); }
    }}>{pending ? "Đang gửi yêu cầu..." : "Gửi lại email xác minh"}</Button>
    {result && <p role={result.success ? "status" : "alert"} className={`text-xs ${result.success ? "text-muted-foreground" : "text-destructive"}`}>{result.message}</p>}
  </div>;
}
