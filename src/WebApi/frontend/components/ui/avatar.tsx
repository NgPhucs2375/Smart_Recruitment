import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

export function AvatarImage({ className, alt = "", ...props }: React.ComponentProps<"img">) {
  return <img alt={alt} className={cn("aspect-square size-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("flex size-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground", className)} {...props} />;
}
