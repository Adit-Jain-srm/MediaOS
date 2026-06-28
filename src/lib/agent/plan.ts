import { z } from "zod";

import type { AgentPlan, AgentPlanStep } from "./types";
import type { OperatorMode, SuggestedAction } from "./events";

/**
 * Planning helpers for the Operator runtime - all pure and dependency-light so
 * they are trivially unit-testable and safe to run offline:
 *
 * - `parsePlan`   tolerant extraction of a model-authored JSON plan
 * - `fallbackPlan`a deterministic plan used when the model is unavailable or its
 *                 output cannot be parsed (keeps the demo working without Azure)
 * - `pickPendingStepForTool` reconciles a streamed tool call to a plan step
 * - `buildSuggestedActions`  context-aware next-step chips
 */

/** Schema the model is asked to emit. Bounded so a hallucinated giant plan fails parse. */
export const planDraftSchema = z.object({
  steps: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(400).optional(),
        tool: z.string().max(64).optional(),
      }),
    )
    .min(1)
    .max(8),
});

export type PlanDraft = z.infer<typeof planDraftSchema>;

/** System prompt for the dedicated planning pass. */
export const PLANNER_SYSTEM_PROMPT = [
  "You are the planning module of the Operator, an autonomous AI media buyer.",
  "Decompose the user's goal into a short, ordered plan of 2-5 concrete steps.",
  "Prefer steps that map to an available tool; set the step's `tool` to that tool's exact name.",
  "Respond with ONLY a JSON object of the form:",
  '{"steps":[{"title":"...","description":"...","tool":"optional_tool_name"}]}',
  "No prose, no markdown fences - just the JSON object.",
].join("\n");

/** Builds the planning user prompt from the goal and the live tool catalog. */
export function buildPlanningPrompt(goal: string, tools: { name: string; description: string }[]): string {
  const toolList =
    tools.length > 0
      ? tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")
      : "- (no tools registered yet)";
  return [`Goal: ${goal}`, "", "Available tools:", toolList, "", "Produce the JSON plan now."].join("\n");
}

/**
 * Extracts a JSON object from arbitrary model text: tries the whole string,
 * then a ```json fenced block, then the first balanced `{...}` span. Returns the
 * normalized `AgentPlan` or `null` if nothing valid is found.
 */
export function parsePlan(text: string, goal: string): AgentPlan | null {
  for (const candidate of jsonCandidates(text)) {
    let value: unknown;
    try {
      value = JSON.parse(candidate);
    } catch {
      continue;
    }
    const parsed = planDraftSchema.safeParse(value);
    if (parsed.success) return draftToPlan(parsed.data, goal);
  }
  return null;
}

function* jsonCandidates(text: string): Generator<string> {
  const trimmed = text.trim();
  if (trimmed) yield trimmed;

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  if (fenced?.[1]) yield fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) yield text.slice(start, end + 1);
}

function draftToPlan(draft: PlanDraft, goal: string): AgentPlan {
  return {
    goal,
    createdAt: new Date().toISOString(),
    steps: draft.steps.map((step, index) => ({
      id: `step-${index + 1}`,
      title: step.title,
      description: step.description,
      tool: step.tool,
      status: "pending",
    })),
  };
}

/**
 * Deterministic plan used when the model can't be reached or its output is
 * unparseable. Includes steps wired to whichever built-in tools are registered
 * so the offline demo still executes real tool calls.
 */
export function fallbackPlan(goal: string, toolNames: string[] = []): AgentPlan {
  const has = (name: string) => toolNames.includes(name);
  const steps: AgentPlanStep[] = [{ id: "step-1", title: "Interpret the goal", description: "Restate what success looks like and the constraints.", status: "pending" }];

  if (has("list_capabilities")) {
    steps.push({ id: `step-${steps.length + 1}`, title: "Review available capabilities", description: "Check which tools the Operator can use right now.", tool: "list_capabilities", status: "pending" });
  }
  if (has("summarize_context")) {
    steps.push({ id: `step-${steps.length + 1}`, title: "Summarize the working context", description: "Ground the plan in the active conversation and campaign.", tool: "summarize_context", status: "pending" });
  }

  steps.push({ id: `step-${steps.length + 1}`, title: "Recommend next actions", description: "Propose the highest-leverage next steps for this goal.", status: "pending" });
  return { goal, createdAt: new Date().toISOString(), steps };
}

/**
 * Reconciles a streamed tool call to a plan step. Prefers a pending step that
 * explicitly targets the tool, then any pending step without a tool, then any
 * remaining pending step. `consumed` tracks step ids already matched this run.
 */
export function pickPendingStepForTool(
  steps: AgentPlanStep[],
  toolName: string,
  consumed: ReadonlySet<string>,
): AgentPlanStep | undefined {
  const available = steps.filter((step) => !consumed.has(step.id) && step.status === "pending");
  return (
    available.find((step) => step.tool === toolName) ??
    available.find((step) => !step.tool) ??
    available[0]
  );
}

/** Count of finished (completed/skipped) steps over the total - for the plan header. */
export function summarizePlan(plan: AgentPlan): { done: number; total: number } {
  const total = plan.steps.length;
  const done = plan.steps.filter((step) => step.status === "completed" || step.status === "skipped").length;
  return { done, total };
}

export interface SuggestedActionInput {
  goal: string;
  toolNames: string[];
  mode: OperatorMode;
}

/**
 * Builds deterministic, context-aware follow-up chips. Always offers something
 * that works today (capabilities) plus forward-looking actions that map to the
 * platform's roadmap, so the surface feels alive even before module tools land.
 */
export function buildSuggestedActions({ goal, toolNames, mode }: SuggestedActionInput): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  if (toolNames.includes("list_capabilities")) {
    suggestions.push({ id: "capabilities", label: "What can you do?", prompt: "What can you do right now, and what is coming soon?" });
  }

  suggestions.push({
    id: "research",
    label: "Research the audience",
    prompt: `Research the target audience for "${truncate(goal, 80)}" and surface their top pain points with sources.`,
  });
  suggestions.push({
    id: "creatives",
    label: "Draft ad concepts",
    prompt: "Draft three platform-ready ad concepts grounded in the research, each with a hook analysis.",
  });

  if (mode === "demo") {
    suggestions.push({ id: "configure", label: "Enable live mode", prompt: "How do I configure Azure OpenAI so you can run live?" });
  }

  return suggestions.slice(0, 4);
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

/** Derives a short conversation title from the first user goal. */
export function deriveConversationTitle(goal: string): string {
  const clean = goal.replace(/\s+/g, " ").trim();
  if (!clean) return "New conversation";
  return clean.length <= 60 ? clean : `${clean.slice(0, 59)}…`;
}
