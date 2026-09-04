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
    <div className="rounded-2xl border border-[#d8d5ce] bg-white/80 p-6 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-[#151515]">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#69727a]">
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
