"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * GitHub login entry — UI only.
 * Backend GitHub OAuth does NOT exist yet (no endpoint/env/callback),
 * so this stays visibly disabled until the backend capability lands.
 * Do NOT wire it to any endpoint.
 */
export function GithubLoginButton({ text = "Tiếp tục với GitHub" }: { text?: string }) {
  return (
    <span className="block w-full cursor-not-allowed" title="Đăng nhập bằng GitHub đang được phát triển (chờ backend OAuth)">
      <Button
        type="button"
        variant="outline"
        disabled
        aria-disabled="true"
        aria-label={`${text} — sắp phát triển`}
        className="h-10 w-full gap-2 rounded-xl border-border bg-muted/50 text-sm font-medium text-muted-foreground"
      >
        <Github className="size-4" aria-hidden />
        {text}
        <span className="rounded-full bg-muted px-2 py-px text-[10px] font-semibold uppercase tracking-wider">
          Sắp có
        </span>
      </Button>
    </span>
  );
}
