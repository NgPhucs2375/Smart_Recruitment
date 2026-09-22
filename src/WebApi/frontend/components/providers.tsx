"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { createDataProvider } from "@/lib/data-provider";
import { authProvider } from "@/lib/auth-provider";
import { accessControlProvider } from "@/lib/access-control-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {GoogleOAuthProvider} from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner";
const dataProvider = createDataProvider("/api/dotnet");
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// Refine resources để trống — menu/sidebar thật nằm ở
// components/navigation/navigation-config.ts (AppSidebarV2).
// Không khai resource demo ở đây để tránh Refine nhầm quản lý menu/route.
const resources: never[] = [];

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider}
        authProvider={authProvider}
        accessControlProvider={accessControlProvider}
        resources={resources}
        options={{ syncWithLocation: true, title: { text: "CV Copilot" } }}
      >
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </GoogleOAuthProvider>
      </Refine>
    </ThemeProvider>
  );
}
