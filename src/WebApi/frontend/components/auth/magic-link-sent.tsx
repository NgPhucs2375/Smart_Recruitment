import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MagicLinkSentSuccessProps {
  email: string;
  onResend: () => void;
  title?: string;
}

export function MagicLinkSentSuccess({
  email,
  onResend,
  title = "Kiểm tra hòm thư của bạn",
}: MagicLinkSentSuccessProps) {
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-6 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-soft-sage text-primary">
        <CheckCircle2 className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Liên kết đã được gửi tới <b>{email}</b>. Vui lòng kiểm tra cả thư mục Spam.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onResend}
        className="mt-4 h-9 text-xs"
      >
        Gửi lại liên kết khác
      </Button>
    </div>
  );
}
