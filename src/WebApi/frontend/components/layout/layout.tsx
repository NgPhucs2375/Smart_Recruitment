"use client";

import type { PropsWithChildren } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebarV2 } from "@/components/layout/sidebar-v2";
import { AppHeaderV2 } from "@/components/layout/header-v2";
import { CandidateHeader } from "@/components/layout/candidate-header";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { useStoredIdentity, useIdentityResolved } from "@/hooks/use-stored-identity";

export function AppLayout({ children }: PropsWithChildren) {
  const identity = useStoredIdentity();
  const resolved = useIdentityResolved();

  // Identity not yet read from localStorage — render neutral shell
  // to prevent role-specific layout flash (admin sidebar for candidate, etc.)
  if (!resolved) {
    return (
      <TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <div className="flex min-h-dvh items-center justify-center bg-background px-6" aria-busy="true" aria-label="Đang tải">
          <div className="w-full max-w-3xl space-y-4" aria-hidden="true">
            <div className="h-8 w-1/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted [animation-delay:120ms]" />
              <div className="h-24 animate-pulse rounded-xl bg-muted [animation-delay:240ms]" />
            </div>
            <span className="sr-only">Đang tải…</span>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  const isCandidate = identity?.roles.some((role) => role.trim().toUpperCase() === "UNG_VIEN") ?? false;

  if (isCandidate) {
    return (
      <TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <CandidateHeader />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-8">
          {children}
        </main>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebarV2 />
        <Toaster position="top-right" richColors closeButton />
        <SidebarInset className="min-w-0 bg-[#f5f5f3]">
          <AppHeaderV2 />
          <main
            className={cn(
              "relative flex w-full flex-1 flex-col",
              "px-4 pt-5 pb-10 md:px-8 md:pt-7",
            )}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
