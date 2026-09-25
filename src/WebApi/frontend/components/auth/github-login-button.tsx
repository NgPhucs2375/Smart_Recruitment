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
    <span className="block w-full cursor-not-allowed" title="GitHub OAuth đang chờ tích hợp phía máy chủ">
      <Button
        type="button"
        variant="outline"
        disabled
        aria-disabled="true"
        aria-label={`${text} — sắp phát triển`}
        className="relative h-11 w-full justify-start gap-3 rounded-xl border-border bg-white px-4 text-sm font-medium text-foreground opacity-70 shadow-sm disabled:opacity-70"
      >
        <span className="flex size-6 items-center justify-center rounded-lg bg-[#24292f] text-white">
          <Github className="size-3.5" aria-hidden />
        </span>
        <span className="flex-1 text-center">{text}</span>
        {/* <span className="rounded-full border border-border bg-muted px-2 py-px text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sắp có
        </span> */}
      </Button>
    </span>
  );
}
