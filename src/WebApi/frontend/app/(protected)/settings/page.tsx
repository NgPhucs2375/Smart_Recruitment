"use client";

import { redirect } from "next/navigation";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { resolveWorkspace } from "@/components/navigation/navigation-config";
import { AdminSettings } from "@/features/settings/admin-settings";
import { CandidateSettings } from "@/features/settings/candidate-settings";

/**
 * /settings resolves the workspace/role and renders role-appropriate content:
 * candidate → personal settings, recruiter → workspace settings,
 * admin → system settings. Shared bits live in features/settings/.
 * Recruiter settings đã gom vào tab "Cài đặt" của /tai-khoan → chuyển hướng.
 */
export default function SettingsPage() {
  const identity = useStoredIdentity();
  const workspace = resolveWorkspace(identity?.roles ?? []);

  if (workspace === "recruiter") redirect("/tai-khoan?tab=cai-dat");
  if (workspace === "admin") return <AdminSettings />;
  return <CandidateSettings identity={identity} />;
}
