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
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <span className="text-xs text-muted-foreground">Đang tải...</span>
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
