"use client";

import type { ReactNode } from "react";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { AgentRail } from "./agent-rail";
import { CommandPalette } from "./command-palette";
import { DashboardErrorBoundary } from "./error-boundary";
import { FloatingSuggestions } from "./floating-suggestions";
import { OperatorRail } from "@/components/agent/operator-rail";

/**
 * Dashboard chrome: left sidebar, top bar, scrollable main, and the persistent
 * Operator rail. Layout reacts to the UI store (collapse / rail visibility).
 * Wrapped in an error boundary so unhandled client errors never white-screen.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardErrorBoundary>
      <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
        <AgentRail>
          <OperatorRail />
        </AgentRail>
        <CommandPalette />
        <FloatingSuggestions />
      </div>
    </DashboardErrorBoundary>
  );
}
