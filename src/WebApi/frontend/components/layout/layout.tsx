"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebarV2 } from "@/components/layout/sidebar-v2";
import { AppHeaderV2 } from "@/components/layout/header-v2";
import { CandidateHeader } from "@/components/layout/candidate-header";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { useStoredIdentity, useIdentityResolved } from "@/hooks/use-stored-identity";
import { resolveWorkspace } from "@/components/navigation/navigation-config";

function NeutralShell() {
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

export function AppLayout({ children }: PropsWithChildren) {
  const identity = useStoredIdentity();
  const resolved = useIdentityResolved();

  // Identity not yet read from localStorage — render neutral shell only.
  // NEVER render any workspace (especially Admin) as a fallback.
  if (!resolved) {
    return <NeutralShell />;
  }

  // Token present but identity missing/unreadable (e.g. /me failed to
  // normalize after login, corrupted storage): the session is unusable.
  // Send back to the shared login flow instead of defaulting to Admin.
  if (!identity) {
    return <RedirectShell to="/login" />;
  }

  const workspace = resolveWorkspace(identity.roles);

  if (workspace === "candidate") {
    return (
      <div className="tone-candidate contents">
        <TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
          <CandidateHeader />
          <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-8">
            {children}
          </main>
        </TooltipProvider>
      </div>
    );
  }

  if (workspace === "recruiter") {
    return (
      <div className="tone-recruiter contents">
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebarV2 />
            <Toaster position="top-right" richColors closeButton />
            <SidebarInset className="min-w-0 bg-workspace">
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
      </div>
    );
  }

  if (workspace === "admin") {
    return (
      <div className="tone-admin contents">
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebarV2 />
            <Toaster position="top-right" richColors closeButton />
            <SidebarInset className="min-w-0 bg-workspace">
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
      </div>
    );
  }

  // Authenticated but role unrecognized — existing unauthorized flow.
  // NEVER fall through to the Admin shell.
  return <RedirectShell to="/unauthorized" />;
}

/** Renders the neutral shell while navigating away (no workspace flash). */
function RedirectShell({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return <NeutralShell />;
}
