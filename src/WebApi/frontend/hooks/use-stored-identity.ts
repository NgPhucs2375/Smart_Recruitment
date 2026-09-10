"use client";

import { useSyncExternalStore } from "react";
import { loadIdentity, type StoredIdentity } from "@/lib/access-control-provider";

const IDENTITY_EVENT = "hireai:identity-changed";
let snapshot: StoredIdentity | null = null;
let snapshotRaw: string | null = null;
let hydrated = false;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(IDENTITY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(IDENTITY_EVENT, callback);
  };
}

export function notifyIdentityChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(IDENTITY_EVENT));
  }
}

function getSnapshot() {
  const raw = localStorage.getItem("user_identity");
  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw;
  snapshot = loadIdentity();
  hydrated = true;
  return snapshot;
}

/**
 * Returns the stored identity or null.
 *
 * `null` means one of two things:
 *  1. Identity has not been read from localStorage yet (first render / SSR).
 *  2. User is genuinely unauthenticated (no identity stored).
 *
 * Use `useIdentityResolved()` to distinguish the two cases.
 */
export function useStoredIdentity(): StoredIdentity | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/**
 * Returns `true` once the identity has been read from localStorage at least once.
 * Before that, it returns `false` (identity is still resolving).
 *
 * Combine with `useStoredIdentity()`:
 *   const identity = useStoredIdentity();
 *   const resolved  = useIdentityResolved();
 *   // resolved=false → show loading skeleton
 *   // resolved=true && identity=null → unauthenticated
 *   // resolved=true && identity=...  → authenticated
 */
export function useIdentityResolved(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}
