"use client";

import type { ReactNode } from "react";
import { Robot, X } from "@phosphor-icons/react";

import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export interface AgentRailProps {
  /**
   * Slot the Operator vertical fills in a later phase (streamed plan, live tool
   * calls, artifacts, composer). When omitted, a placeholder is shown.
   */
  children?: ReactNode;
}

/**
 * Persistent, collapsible right rail for the Operator. This is the shell only -
 * the agent runtime renders into `children`. Toggle state lives in the UI store
 * so the top bar and command palette can open/close it.
 */
export function AgentRail({ children }: AgentRailProps) {
  const open = useUiStore((state) => state.agentRailOpen);
  const setOpen = useUiStore((state) => state.setAgentRailOpen);

  if (!open) return null;

  return (
    <aside className="hidden h-dvh w-80 shrink-0 flex-col border-l border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded-md bg-primary/15 text-primary">
            <Robot className="size-4" weight="fill" />
          </div>
          <span className="font-heading text-sm font-semibold text-foreground">Operator</span>
          <Badge variant="outline" className="text-[10px]">
            shell
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Hide Operator" onClick={() => setOpen(false)}>
          <X />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {children ?? (
          <EmptyState
            icon={<Robot weight="duotone" className="size-5" />}
            title="The Operator lives here"
            description="The autonomous agent will show its plan, run tools live, and stream cited results in this rail. Ask it to research an audience and build a campaign."
          />
        )}
      </div>
    </aside>
  );
}
