import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Message({ className, ...props }: React.ComponentProps<"article">) {
  return <article className={cn("flex gap-3", className)} {...props} />;
}

export function MessageAvatar({ className, src, fallback = "?" }: { className?: string; src?: string; fallback?: string }) {
  return (
    <Avatar className={cn("size-8", className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

export function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0 max-w-[80%] rounded-2xl bg-muted px-4 py-3 text-sm", className)} {...props} />;
}

export function MessageScroller({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto", className)} {...props} />;
}
