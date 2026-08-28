"use client";

import type { PropsWithChildren } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <Toaster position="top-right" richColors closeButton />
      <SidebarInset className="min-w-0">
        <AppHeader />
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
