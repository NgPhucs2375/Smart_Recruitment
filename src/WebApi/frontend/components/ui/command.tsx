"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function Command({ className, children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command" className={cn("flex w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground", className)} {...props}>{children}</div>;
}

function CommandInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-border px-3">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input data-slot="command-input" className={cn("flex h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground", className)} {...props} />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command-list" role="listbox" className={cn("max-h-56 overflow-y-auto p-1", className)} {...props} />;
}

function CommandItem({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" role="option" aria-selected={false} data-slot="command-item" className={cn("flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent", className)} {...props} />;
}

function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command-empty" className={cn("px-3 py-6 text-center text-sm text-muted-foreground", className)} {...props} />;
}

export { Command, CommandInput, CommandList, CommandItem, CommandEmpty };
