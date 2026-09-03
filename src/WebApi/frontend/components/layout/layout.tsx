"use client";

import type { PropsWithChildren } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebarV2 } from "@/components/layout/sidebar-v2";
import { AppHeaderV2 } from "@/components/layout/header-v2";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebarV2 />
        <Toaster position="top-right" richColors closeButton />
        <SidebarInset className="min-w-0">
          <AppHeaderV2 />
          <main
            className={cn(
              "relative flex w-full flex-1 flex-col",
              "px-4 pt-4 pb-8",
              "md:px-6 md:pt-6",
            )}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
