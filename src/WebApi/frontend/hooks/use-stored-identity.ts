"use client";

import { useSyncExternalStore } from "react";
import { loadIdentity, type StoredIdentity } from "@/lib/access-control-provider";

const IDENTITY_EVENT = "hireai:identity-changed";
let snapshot: StoredIdentity | null = null;
let snapshotRaw: string | null = null;

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
  return snapshot;
}

export function useStoredIdentity(): StoredIdentity | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
