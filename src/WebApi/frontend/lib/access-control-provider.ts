import type { AccessControlProvider } from "@refinedev/core";
import { hasPermission, type Permission } from "./permissions";
import { IDENTITY_KEY, readSessionValue, removeSessionValues, saveSessionValue, sessionPersistence } from "./session-storage";

// ─── Storage helpers ──────────────────────────────────────────────────────────

export interface StoredIdentity {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: Permission[];
}

/** Identity follows the session store, so a tab-only login leaves no profile behind. */
export function saveIdentity(identity: StoredIdentity): void {
  if (typeof window === "undefined") return;
  saveSessionValue(IDENTITY_KEY, JSON.stringify(identity), sessionPersistence());
  window.dispatchEvent(new Event("hireai:identity-changed"));
}

export function loadIdentity(): StoredIdentity | null {
  try {
    const raw = readSessionValue(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as StoredIdentity) : null;
  } catch {
    return null;
  }
}

export function clearIdentity(): void {
  if (typeof window === "undefined") return;
  removeSessionValues([IDENTITY_KEY]);
  window.dispatchEvent(new Event("hireai:identity-changed"));
}

/** Build a StoredIdentity from the /me API response using server-returned permissions. */
export function buildIdentity(me: {
  id: string;
  email: string;
  userName: string;
  roles: string[];
  permissions: { resource: string; action: string }[];
}): StoredIdentity {
  return {
    id: me.id,
    email: me.email,
    name: me.userName,
    roles: me.roles,
    // Use permissions directly from the server — no local mapping needed.
    permissions: me.permissions,
  };
}

// ─── Refine accessControlProvider ────────────────────────────────────────────

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const identity = loadIdentity();
    if (!identity) {
      return { can: false, reason: "Unauthenticated" };
    }

    const allowed = hasPermission(identity.permissions, resource ?? "", action);
    return {
      can: allowed,
      reason: allowed ? undefined : "You do not have permission to perform this action.",
    };
  },

  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
