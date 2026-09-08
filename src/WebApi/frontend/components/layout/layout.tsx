"use client";

import type { PropsWithChildren } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebarV2 } from "@/components/layout/sidebar-v2";
import { AppHeaderV2 } from "@/components/layout/header-v2";
import { CandidateHeader } from "@/components/layout/candidate-header";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

export function AppLayout({ children }: PropsWithChildren) {
  const identity = useStoredIdentity();
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
        <SidebarInset className="min-w-0 bg-muted/30">
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
