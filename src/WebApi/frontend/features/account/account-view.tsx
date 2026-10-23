"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Settings, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { RecruiterProfileTab } from "./recruiter-profile-tab";
import { CompanyInfoTab } from "./company-info-tab";
import { RecruiterSettings } from "@/features/settings/recruiter-settings";

const TABS = [
  { value: "ca-nhan", label: "Cá nhân", icon: UserRound },
  { value: "cong-ty", label: "Công ty", icon: Building2 },
  { value: "cai-dat", label: "Cài đặt", icon: Settings },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

/** Gom 3 màn hình (Hồ sơ của tôi / Hồ sơ doanh nghiệp / Cài đặt) vào 1 tab Tài khoản. */
export function AccountView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const identity = useStoredIdentity();

  const raw = searchParams.get("tab");
  const tab: TabValue = isTabValue(raw) ? raw : "ca-nhan";

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="sr-only">Tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý hồ sơ cá nhân, doanh nghiệp và không gian tuyển dụng.
        </p>
      </div>

      <Tabs defaultValue="ca-nhan" value={tab} onValueChange={setTab}>
        <TabsList className="rounded-full">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2 rounded-full px-4">
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ca-nhan" className="mt-5">
          <RecruiterProfileTab />
        </TabsContent>

        <TabsContent value="cong-ty" className="mt-5">
          <CompanyInfoTab />
        </TabsContent>

        <TabsContent value="cai-dat" className="mt-5">
          <RecruiterSettings identity={identity} embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
