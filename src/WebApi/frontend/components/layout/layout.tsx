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
import { loginRouteForPortal } from "@/lib/auth-provider";

function NeutralShell() {
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
  // Send back to the portal login flow instead of defaulting to Admin.
  if (!identity) {
    return <RedirectShell to={loginRouteForPortal()} />;
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
