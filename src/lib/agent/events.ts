/**
 * Operator streaming protocol.
 *
 * The runtime emits a stream of small, typed `OperatorEvent`s (newline-delimited
 * JSON) that the UI reduces into state: a visible plan, live tool calls, streamed
 * assistant text, and suggested next actions. Keeping our own event union (rather
 * than leaning on the AI SDK's wire format) lets the UI be fully demoable offline
 * and keeps the client decoupled from the model provider.
 *
 * This module is import-safe on both server and client: it only uses `import type`
 * from `./types`, so it pulls no server-only code (Azure / Supabase) into the
 * browser bundle.
 */

import type {
  AgentArtifact,
  AgentPlan,
  AgentRunStatus,
  AgentToolResult,
  PlanStepStatus,
} from "./types";

/** "live" = real Azure tool-calling; "demo" = scripted offline run (Azure unset). */
export type OperatorMode = "live" | "demo";

export type NoticeLevel = "info" | "warning" | "error";

/** A one-tap follow-up the user can send back to the Operator. */
export interface SuggestedAction {
  id: string;
  label: string;
  /** The message dispatched to the Operator when the chip is clicked. */
  prompt: string;
}

/**
 * The discriminated union streamed from the runtime to the UI. New event kinds
 * are added here and handled exhaustively by the reducer in `useOperator`.
 */
export type OperatorEvent =
  | { type: "run-start"; runId: string; conversationId: string; goal: string; mode: OperatorMode }
  | { type: "status"; status: AgentRunStatus }
  | { type: "plan"; plan: AgentPlan }
  | { type: "step"; stepId: string; status: PlanStepStatus }
  | { type: "message"; delta: string }
  | { type: "tool-call"; callId: string; name: string; args: unknown; stepId?: string }
  | { type: "tool-result"; callId: string; name: string; result: AgentToolResult; stepId?: string }
  | { type: "artifact"; artifact: AgentArtifact }
  | { type: "suggestions"; suggestions: SuggestedAction[] }
  | { type: "notice"; level: NoticeLevel; message: string }
  | { type: "run-finish"; status: AgentRunStatus }
  | { type: "error"; message: string };

export type OperatorEventType = OperatorEvent["type"];

/** Serializes one event as a single NDJSON line (trailing newline included). */
export function encodeEvent(event: OperatorEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/**
 * Incrementally parses NDJSON from a streamed text buffer. Returns the complete
 * events found plus any trailing partial line (`rest`) the caller should prepend
 * to the next chunk. Malformed lines are skipped rather than throwing, so one bad
 * frame never breaks the stream.
 */
export function decodeEvents(buffer: string): { events: OperatorEvent[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events: OperatorEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parsed = safeParseEvent(trimmed);
    if (parsed) events.push(parsed);
  }

  return { events, rest };
}

function safeParseEvent(line: string): OperatorEvent | null {
  try {
    const value = JSON.parse(line) as unknown;
    if (value && typeof value === "object" && "type" in value) {
      return value as OperatorEvent;
    }
    return null;
  } catch {
    return null;
  }
}
