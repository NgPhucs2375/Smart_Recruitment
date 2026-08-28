"use client";

import { useSyncExternalStore, lazy, Suspense, type ReactNode } from "react";

const emptySubscribe = () => () => {};

const CopilotKitInner = lazy(() =>
  import("@copilotkit/react-core").then((mod) => ({ default: mod.CopilotKit })),
);

export function CopilotKitWrapper({
  children,
  runtimeUrl,
  agent,
}: {
  children: ReactNode;
  runtimeUrl: string;
  agent: string;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={null}>
      <CopilotKitInner runtimeUrl={runtimeUrl} agent={agent}>
        {children}
      </CopilotKitInner>
    </Suspense>
  );
}
    