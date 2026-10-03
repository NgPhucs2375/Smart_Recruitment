"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGate } from "@/features/admin/AdminGate";

const TABS = [
  { value: "themes", label: "Theme AI", href: "/admin/cv/themes" },
  { value: "ung-vien", label: "CV ứng viên", href: "/admin/cv/ung-vien" },
] as const;

/** Shell quản lý CV thống nhất: 2 route con, Tabs đồng bộ URL. */
export default function AdminCvLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname.includes("/admin/cv/ung-vien") ? "ung-vien" : "themes";

  return (
    <AdminGate>
      <div className="space-y-4 p-6 pb-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Quản lý CV/mẫu CV</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản trị theme AI cho gợi ý mẫu và tra cứu CV ứng viên.
          </p>
        </div>
        <Tabs
          value={active}
          defaultValue="themes"
          onValueChange={(v) => {
            const tab = TABS.find((t) => t.value === v);
            if (tab) router.push(tab.href);
          }}
        >
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {children}
    </AdminGate>
  );
}
