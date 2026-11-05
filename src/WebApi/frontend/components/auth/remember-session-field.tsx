"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Ô chọn chế độ phiên, dùng chung cho mọi trang đăng nhập để candidate và
 * employer không lệch nhau: tick = giữ phiên sau khi đóng trình duyệt,
 * không tick = phiên chết khi đóng tab.
 */
export function RememberSessionField({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 pt-0.5">
      <Checkbox
        id="remember"
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={disabled}
      />
      <Label htmlFor="remember" className="cursor-pointer text-xs text-muted-foreground">
        Duy trì đăng nhập trên thiết bị này
      </Label>
    </div>
  );
}
