"use client";

import { Refine, type NotificationProvider } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { Users, ShieldCheck, Shield, UserCog, BarChart3, FileText, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { createDataProvider } from "@/lib/data-provider";
import { authProvider } from "@/lib/auth-provider";
import { accessControlProvider } from "@/lib/access-control-provider";

const notificationProvider: NotificationProvider = {
  open: ({ type, message, description, key }) => {
    const opts = { id: key, description };
    if (type === "success") toast.success(message, opts);
    else if (type === "error") toast.error(message, opts);
    else toast.info(message, opts);
  },
  close: (key) => toast.dismiss(key),
};

// Always relative — browser calls same origin, Next.js rewrites proxy to .NET.
// See next.config.ts: /api/dotnet/* → DOTNET_API_URL/api/*
const API_URL = "/api/dotnet";

const dataProvider = createDataProvider(API_URL);

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <Refine
      dataProvider={dataProvider}
      authProvider={authProvider}
      accessControlProvider={accessControlProvider}
      routerProvider={routerProvider}
      notificationProvider={notificationProvider}
      resources={[
        {
          name: "TodoLists",
          list: "/todo-lists",
          create: "/todo-lists/create",
          edit: "/todo-lists/edit/:id",
          meta: { label: "Todo Lists" },
        },
        {
          name: "Invoices",
          list: "/invoices",
          meta: { label: "Invoices", icon: <FileText className="h-4 w-4" /> },
        },
        {
          name: "RegulatoryRequests",
          list: "/regulatory-requests",
          meta: {
            label: "Regulatory Requests",
            icon: <ClipboardList className="h-4 w-4" />,
          },
        },
        {
          name: "TodoListReport",
          list: "/reports",
          meta: {
            label: "Reports",
            icon: <BarChart3 className="h-4 w-4" />,
            requiredResource: "TodoLists",
            requiredAction: "list",
          },
        },
        {
          name: "WorkflowReport",
          list: "/reports/workflow",
          meta: {
            label: "Workflow Report",
            icon: <BarChart3 className="h-4 w-4" />,
            requiredResource: "TodoLists",
            requiredAction: "list",
          },
        },
        {
          name: "UserManagement",
          list: "/users",
          meta: { label: "Users", icon: <UserCog className="h-4 w-4" /> },
        },
        {
          name: "Roles",
          list: "/roles",
          meta: { label: "Roles", icon: <Shield className="h-4 w-4" /> },
        },
        {
          name: "UserRoles",
          list: "/user-roles",
          meta: { label: "User Roles", icon: <Users className="h-4 w-4" /> },
        },
        {
          name: "PermissionMatrix",
          list: "/permission-matrix",
          meta: { label: "Permission Matrix", icon: <ShieldCheck className="h-4 w-4" /> },
        },
      ]}
      options={{ syncWithLocation: true }}
    >
      {children}
    </Refine>
  );
}
