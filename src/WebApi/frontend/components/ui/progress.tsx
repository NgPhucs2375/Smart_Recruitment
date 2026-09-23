import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }: React.ComponentProps<"div"> & { value?: number | null }) {
  const safeValue = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - safeValue}%)` }} />
    </div>
  );
}
