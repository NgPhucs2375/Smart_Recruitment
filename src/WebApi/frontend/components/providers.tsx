"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { createDataProvider } from "@/lib/data-provider";
import { authProvider } from "@/lib/auth-provider";
import { accessControlProvider } from "@/lib/access-control-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { CopilotProvider } from "@/app/providers/CopilotProvider";
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

const resources = [
  { name: "dashboard", list: "/", meta: { label: "Dashboard", icon: <LayoutDashboard />, requiredResource: "dashboard" } },
  { name: "cv", list: "/CV", meta: { label: "CV", icon: <FileText />, requiredResource: "cv" } },
  { name: "invoices", list: "/invoices", meta: { label: "Invoices", icon: <Receipt />, requiredResource: "invoices" } },
  { name: "reports", list: "/reports", meta: { label: "Reports", icon: <BarChart3 />, requiredResource: "reports" } },
  { name: "user-roles", list: "/user-roles", meta: { label: "User Roles", icon: <Users />, requiredResource: "user-roles" } },
  { name: "permission-matrix", list: "/permission-matrix", meta: { label: "Permission Matrix", icon: <ShieldCheck />, requiredResource: "permission-matrix" } },
  { name: "regulatory-requests", list: "/regulatory-requests", meta: { label: "Regulatory Requests", icon: <FileCheck2 />, requiredResource: "regulatory-requests" } },
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
        <CopilotProvider>{children}</CopilotProvider>
      </Refine>
    </ThemeProvider>
  );
}
