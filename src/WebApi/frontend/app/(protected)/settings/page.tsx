"use client";

import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { resolveWorkspace } from "@/components/navigation/navigation-config";
import { AdminSettings } from "@/features/settings/admin-settings";
import { CandidateSettings } from "@/features/settings/candidate-settings";
import { RecruiterSettings } from "@/features/settings/recruiter-settings";

/**
 * /settings resolves the workspace/role and renders role-appropriate content:
 * candidate → personal settings, recruiter → workspace settings,
 * admin → system settings. Shared bits live in features/settings/.
 */
export default function SettingsPage() {
  const identity = useStoredIdentity();
  const workspace = resolveWorkspace(identity?.roles ?? []);

  if (workspace === "admin") return <AdminSettings />;
  if (workspace === "recruiter") return <RecruiterSettings identity={identity} />;
  return <CandidateSettings identity={identity} />;
}
