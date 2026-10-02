"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  baseId: string;
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within <Tabs>");
  return context;
}

function tabDomId(baseId: string, value: string, suffix: "trigger" | "panel") {
  return `${baseId}-${suffix}-${value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  className,
  children,
  ...props
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const onValueChange = controlledOnValueChange ?? setInternalValue;
  const baseId = React.useId();

  return (
    <TabsContext.Provider value={{ baseId, value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
    );
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    else if (event.key === "ArrowRight") nextIndex = currentIndex === -1 || currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    else if (event.key === "Home") nextIndex = 0;
    else nextIndex = tabs.length - 1;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    nextTab.focus();
    nextTab.click();
  }

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

function TabsTrigger({
  value,
  className,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { baseId, value: selectedValue, onValueChange } = useTabs();
  const isActive = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      id={tabDomId(baseId, value, "trigger")}
      aria-selected={isActive}
      aria-controls={tabDomId(baseId, value, "panel")}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onValueChange(value);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { baseId, value: selectedValue } = useTabs();

  if (selectedValue !== value) return null;

  return (
    <div
      role="tabpanel"
      id={tabDomId(baseId, value, "panel")}
      aria-labelledby={tabDomId(baseId, value, "trigger")}
      tabIndex={0}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
