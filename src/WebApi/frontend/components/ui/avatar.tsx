import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

export function AvatarImage({ className, alt = "", src, onError, ...props }: React.ComponentProps<"img">) {
  const [failed, setFailed] = React.useState(false);
  // Không src (logo trống) hoặc load lỗi (404) -> không render <img> để
  // AvatarFallback initials bên dưới hiện ra, thay vì ô trắng che lấp.
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- cần onError fallback, dynamic src từ API
    <img
      alt={alt}
      src={src}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      className={cn("absolute inset-0 aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("flex size-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground", className)} {...props} />;
}
