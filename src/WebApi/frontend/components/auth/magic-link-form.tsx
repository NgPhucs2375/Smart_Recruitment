"use client";

import { Mail, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MagicLinkSentSuccess } from "./magic-link-sent";

interface MagicLinkFormProps {
  email: string;
  setEmail: (email: string) => void;
  sent: boolean;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  buttonText?: string;
  label?: string;
}

export function MagicLinkForm({
  email,
  setEmail,
  sent,
  loading,
  error,
  onSubmit,
  onReset,
  buttonText = "Gửi Magic Link qua Email",
  label = "Đăng nhập nhanh không cần mật khẩu",
}: MagicLinkFormProps) {
  if (sent) {
    return <MagicLinkSentSuccess email={email} onResend={onReset} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 py-2 text-xs text-red-700">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="magic-email-input" className="text-xs font-medium uppercase tracking-wider text-[#69727a]">
          {label}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="magic-email-input"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="h-11 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm transition focus-visible:ring-1 focus-visible:ring-[#151515]"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !email.trim()}
        variant="outline"
        className="h-11 w-full rounded-xl border-[#d8d5ce] bg-white font-medium text-[#151515] transition hover:bg-[#f4f2ed]"
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 size-4 text-amber-500" />
        )}
        {loading ? "Đang gửi..." : buttonText}
      </Button>
    </form>
  );
}
