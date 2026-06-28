# MediaOS - Project Progress (single source of truth)

This is the durable tracker a fresh agent can resume from. Update it in the same change that alters
status. Cross-references: [architecture](./architecture.md), [ADRs](./adr/),
[research-engine](./research-engine.md), [api](./api.md), [runbook](./runbook.md),
[learnings](./learnings.md).

---

## Objective

Build **MediaOS** - an AI-native media buying platform whose primary surface is **the Operator**, an
autonomous agent that plans, executes, monitors, and improves marketing campaigns end to end. The
moat is the **Audience Research Intelligence Engine** (OpenBB-inspired, real data via Bright Data).
Goal: investor-demo quality, senior-level system design, win the It's Today Media build challenge.

---

## Current Status

**Wave 0 - Foundation: DONE, verified, committed.**

Delivered:
- Next.js 16 + React 19.2 + TS strict + Tailwind v4 + shadcn (base-nova / Base UI) scaffold.
- Supabase clients (browser/server/admin) + `src/proxy.ts` route protection.
- Full 19-table schema + RLS + storage buckets (`supabase/migrations/0001_init.sql`, `0002_storage.sql`).
- Shared contracts: typed errors, resilience (retry/timeout/circuit breaker), lazy env loader,
  Zod validators, Azure OpenAI client, research engine core (standard models, provider/TET, registry,
  orchestrator, Bright Data adapter, analyzer), agent tool registry + prompts, service stubs.
- Dashboard shell + auth pages + public `/lp/[slug]` route.
- **Test harness:** Vitest + Playwright wired; 35 passing unit tests across env, resilience,
  validators, and both registries; e2e golden-path seed.
- **Docs:** architecture, 4 ADRs, research-engine, api, runbook, learnings, this tracker.

Verification (foundation baseline): `npx tsc --noEmit`, `npm run lint`, `npm run build`,
`npm test` all green. Baseline committed - see `git log` for hashes.

---

## Build Wave Plan + File-Claim Map

Waves group work that can proceed in parallel. **Each module owns its directories** (the file-claim
map) so parallel agents don't collide. Shared foundation files (`src/lib/errors.ts`,
`resilience.ts`, `env.ts`, `research/standard-models.ts`, `agent/types.ts`) are **frozen contracts** -
extend via new files, don't rewrite. Serialize all git operations (one committer at a time).

| Wave | Module (plan id) | Owns (file-claim) | Depends on |
|---|---|---|---|
| **0** | Foundation | (done) `src/lib/*` contracts, `supabase/`, shell | - |
| **1** | Operator core (`agent-core`) | `src/lib/agent/runtime.ts`, `src/app/(dashboard)/operator/**`, `src/components/agent/**`, `src/app/api/agent/**` | Wave 0 |
| **1** | Research core (`research-core`) | Bright Data transport in `src/lib/research/brightdata.ts`, `src/lib/research/providers/_shared/**` | Wave 0 |
| **2** | Research providers + AI (`research-providers`, `research-ai`) | `src/lib/research/providers/**`, `analyzer` impl behind `setResearchAnalyzer` | Wave 1 research-core |
| **2** | Research UI (`research-ui`) | `src/components/research/**`, `src/app/(dashboard)/research/**` | Wave 1 |
| **2** | Agent tools (`agent-tools`) | `src/lib/agent/tools/**` (register research first) | Wave 1 |
| **3** | Campaigns (`campaigns`) | `campaign.service` impl, `src/components/campaign/**`, `src/app/(dashboard)/campaigns/**` | Wave 2 |
| **3** | Creative Studio (`creative-*`) | `creative.service` impl, `src/components/creative/**`, `src/app/(dashboard)/creatives/**`, `creative-images` storage | Wave 2 |
| **4** | Landing Pages (`landing-*`) | `landing.service` impl, `src/components/landing-page/**`, `src/app/(dashboard)/landing-pages/**`, `src/app/lp/**`, `src/app/api/lead`, `src/app/api/page-view` | Wave 3 |
| **4** | Performance Intelligence (`analytics-*`) | `analytics.service` impl, `src/lib/analytics/**`, `src/components/analytics/**`, `src/app/(dashboard)/analytics/**` | Wave 3 |
| **5** | Agent orchestration + demo seed + integration | `src/lib/seed/**`, cross-module wiring, command palette, a11y | Waves 2-4 |
| **6** | Ship | Vercel deploy, README (3 answers), demo walkthrough, perf pass | Wave 5 |

---

## Definition of Done (per module)

A module is **not done** until all of the following are true (evidence shown, not assumed):

1. **Code** - implemented to the staff-engineer bar; typed; external calls wrapped in
   `withRetry`/`withTimeout` and throwing typed `AppError`s; secrets server-side; RLS respected.
2. **Tests** - unit/integration written and **passing on a fresh `npm test`**; CI-safe (no network,
   deterministic, Bright Data + AI mocked/fixtured). E2E extended for golden-path-affecting work.
3. **Docs** - relevant `Docs/` page updated in the **same change** (no drift) + a `learnings.md`
   entry for any gotcha.
4. **Quality gates** - `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` all green.
5. **Git** - atomic Conventional Commit(s), pushed to `origin`.

---

## Decisions Log

| # | Decision | Where |
|---|---|---|
| D1 | Next.js 16 (superset of plan's 15); React 19.2; Tailwind v4; Zod v4; AI SDK v7 | [ADR 0001](./adr/0001-tech-stack.md) |
| D2 | shadcn **base-nova** -> Base UI (not Radix) | [ADR 0001](./adr/0001-tech-stack.md), learnings |
| D3 | Research engine = OpenBB TET provider abstraction + registry + orchestrator | [ADR 0002](./adr/0002-research-provider-abstraction.md) |
| D4 | RLS: owner-scoped (denormalized `user_id`) + public deployed-page read + anonymous insert via deployed-page join; path-scoped storage | [ADR 0003](./adr/0003-rls-strategy.md) |
| D5 | Agent = typed tool registry + Zod-validated `defineTool` + plan/execute/observe loop | [ADR 0004](./adr/0004-agent-runtime.md) |
| D6 | Test stack = Vitest (unit/integration, node env) + Playwright (e2e) | this build |
| D7 | App boots without credentials (lazy env, `is*Configured()`), degrading gracefully | `src/lib/env.ts` |

---

## Risks & Open Questions

| Status | Item | Mitigation / Note |
|---|---|---|
| OPEN | Bright Data Pro (`web_data_*`) may be inactive | Engine degrades to verified free-tier search+scrape; Pro providers gated by `isAvailable()` |
| OPEN | Azure image API version (`gpt-image`) | Likely needs a preview `api-version`; configurable via env (learnings) |
| OPEN | Are real credentials in `.env.local`? | App boots without them; verify before live demo / seed |
| OPEN | Demo seed realism (90-day analytics) | `analytics-seed` phase: fatigue curves, seasonality, platform behaviors |
| RESOLVED | Git remote | `origin` exists -> https://github.com/Adit-Jain-srm/MediaOS (branch `main`) |
| RESOLVED | Reference repo leaking into build | Excluded in `.gitignore`, `tsconfig`, `eslint`, `.vercelignore` |

---

## Change Log

- **2026-06-28** - Wave 0 Foundation baselined: scaffold + tooling, Supabase schema/design
  system/shared contracts, Vitest+Playwright test harness (35 unit tests passing), and full `Docs/`
  set (architecture, ADRs 0001-0004, research-engine, api, runbook, learnings, progress). Committed
  as Conventional Commits and pushed to `origin/main`. See `git log --oneline` for hashes.
