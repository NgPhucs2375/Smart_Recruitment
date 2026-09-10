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
import {
  LayoutDashboard,
  FileText,
  Receipt,
  BarChart3,
  Users,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

const dataProvider = createDataProvider("/api/dotnet");
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const resources = [
  { name: "dashboard", list: "/dashboard", meta: { label: "Dashboard", icon: <LayoutDashboard />, requiredResource: "dashboard" } },
  { name: "cv", list: "/CV", meta: { label: "CV", icon: <FileText />, requiredResource: "cvs" } },
  { name: "invoices", list: "/invoices", meta: { label: "Invoices", icon: <Receipt />, requiredResource: "invoices" } },
  { name: "reports", list: "/reports", meta: { label: "Reports", icon: <BarChart3 />, requiredResource: "reports" } },
  { name: "user-roles", list: "/user-roles", meta: { label: "User Roles", icon: <Users />, requiredResource: "roles" } },
  { name: "permission-matrix", list: "/permission-matrix", meta: { label: "Permission Matrix", icon: <ShieldCheck />, requiredResource: "roleclaims" } },
  { name: "regulatory-requests", list: "/regulatory-requests", meta: { label: "Regulatory Requests", icon: <FileCheck2 />, requiredResource: "regulatory-requests" } },
  // Lưu ý: menu sidebar thật nằm ở components/navigation/navigation-config.ts
  // (AppSidebarV2 đọc từ đó). Không thêm mục menu vào resources ở đây.
];

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
