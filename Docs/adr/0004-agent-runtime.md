# ADR 0004: Agent Runtime (tool-calling loop + typed tool registry)

- **Status:** Accepted (contracts); runtime wiring in the agent-core phase
- **Date:** 2026-06-28
- **Deciders:** Foundation build

## Context

The Operator is the primary product surface. It must decompose a natural-language goal into a
visible plan, then execute it by calling real platform capabilities, streaming its reasoning and
producing real artifacts. Two failure modes must be designed out from the start:

1. **Hallucinated / malformed tool arguments** breaking actions mid-run.
2. **Drift** between what the agent can do and what the manual screens can do.

## Decision

### Capabilities are typed tools

Every platform capability is an `AgentTool` (`src/lib/agent/types.ts`): a name, description,
category, a **Zod** `parameters` schema, an `execute(params, ctx)` function, and an optional
artifact renderer. Feature teams author tools with full type-safety via `defineTool` and register
them on the shared `agentToolRegistry` singleton.

```ts
const tool = defineTool({
  name: "research_audience",
  description: "Run the research engine for a query and return cited personas",
  category: "research",
  parameters: z.object({ query: z.string(), providers: z.array(z.string()).optional() }),
  execute: async (params, ctx) => ({ ok: true, data: /* ... */, artifact: /* ... */ }),
});
agentToolRegistry.register(tool);
```

`defineTool` wraps the typed config into a type-erased `AgentTool`. At call time it **`safeParse`s
the raw arguments** before invoking `execute`; invalid arguments return a structured
`{ ok: false, error }` the agent can read and recover from, instead of throwing.

### The runtime is plan -> execute -> observe

(Wired in the agent-core phase against these contracts.) The Planner produces an editable
`AgentPlan` of `AgentPlanStep`s; the Executor runs them through Azure GPT-4o tool-calling
(`src/lib/ai/azure.ts` `streamChat`/`getChatModel`), streaming tokens and tool calls to the UI. Each
step yields an `AgentToolResult` (and optional `AgentArtifact`) fed back into context. Conversations,
messages, and runs persist to `agent_conversations` / `agent_messages` / `agent_runs` (jsonb plan,
tool_calls, tool_results, artifacts).

### Uniform result + error shape

`AgentToolResult` is always `{ ok, data?, error?, artifact? }`. Tools call the service layer / research
engine, which throw typed `AppError`s (`src/lib/errors.ts`); the tool boundary converts failures into
`ok: false` results. The system prompt (`src/lib/agent/prompts.ts`) instructs the Operator to plan
first, use tools for real work, cite sources, fail safe, and label estimates.

### One service layer for agent and cockpit

Tools wrap the same `src/lib/services` functions the manual screens call. There is no separate
"agent backend", so the agent and the cockpit cannot diverge.

## Consequences

- **Positive:** Zod-validated boundaries make hallucinated arguments a recoverable, structured event.
  Adding an agent capability = registering a tool. Streaming + visible plans create the "intelligently
  planning/executing" perception. Persistence gives cross-session, campaign-scoped memory.
- **Negative:** Every capability must be expressed as a tool with a schema and an artifact strategy;
  the streaming tool-call UI is non-trivial. Mitigation: the registry + `defineTool` standardize the
  authoring path, and the registry/validation behavior is unit-tested in the foundation
  (`src/lib/agent/registry.test.ts`).
