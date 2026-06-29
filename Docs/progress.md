# MediaOS - Project Progress (single source of truth)

This is the durable tracker a fresh agent can resume from. Update it in the same change that alters
status. Cross-references: [architecture](./architecture.md), [ADRs](./adr/),
[research-engine](./research-engine.md), [api](./api.md), [runbook](./runbook.md),
[learnings](./learnings.md), [campaigns](./campaigns.md), [creative-studio](./creative-studio.md).

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

**Wave 2 - Audience Research Intelligence Engine + Operator agent: DONE, verified, committed.**

Delivered (two parallel workers, integrated in a single pass):
- **Research Engine** (`src/lib/research/**`, `src/app/(dashboard)/research/**`,
  `src/components/research/**`, `src/app/api/research/run`): provider implementations (search-intent,
  news, reddit/community, social, competitor-ads, web-intel), analyzer, orchestrator, RLS-scoped
  persistence with a lossless report snapshot, and the full research workspace UI (personas, pain
  points, trends, competitor ads, sources/citations, comparison, export). Degrades through a **3-layer
  fallback** (live Bright Data -> enriched -> seeded fixtures) so it always renders with zero credentials.
- **Operator agent** (`src/lib/agent/**`, `src/app/(dashboard)/operator/**`,
  `src/app/api/operator/chat`, `src/components/agent/**`): plan/execute/observe runtime, streamed
  events, typed tool calls, fail-safe persistence, and the compact rail + full workspace chat UI. Runs
  in **demo-mode** with no Azure/Supabase credentials required.
- **Central typing fix:** `src/types/database.ts` Row shapes are now `type` aliases (not `interface`s)
  so `SupabaseClient<Database>` infers Row/Insert/Update; the per-module remap casts in `store.ts` and
  `persistence.ts` were removed (see [learnings](./learnings.md)).
- **Env consistency:** Bright Data zones (`BRIGHTDATA_WEB_UNLOCKER_ZONE`, `BRIGHTDATA_SERP_ZONE`) are
  now centralized in `src/lib/env.ts` + `.env.example` (optional, with defaults).

Verification (fresh run): `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm test`
(**122 passing**, 16 files), and `npm run build` (success - the real integration gate that neither
worker had run). Committed as Conventional Commits and pushed to `origin/main`.

**Wave 3 - Campaigns + Creative Studio: DONE, verified, committed.**

Delivered (two parallel workers, integrated in a single pass):
- **Campaigns** (`src/lib/services/campaign.service.ts`, `src/lib/campaign/**`,
  `src/app/(dashboard)/campaigns/**`, `src/components/campaign/**`): RLS-scoped campaign CRUD, an AI
  **brief builder** (goal/audience/budget -> structured, editable brief with a deterministic fallback),
  **persona import** from saved research reports, a starting-point **template gallery**, a **budget
  allocator**, and **platform recommendations**, surfaced through the campaigns hub, detail, and
  new-campaign routes. See [campaigns](./campaigns.md).
- **Creative Studio** (`src/lib/services/creative.service.ts`, `src/lib/creative/**`,
  `src/app/(dashboard)/creatives/**`, `src/app/api/creative/**`, `src/components/creative/**`):
  platform-aware AI **copy + visual** generation with per-platform limit enforcement, psychological
  **hook analysis**, direct-response **variant scoring**, a research-derived **brand-voice** tone
  profile, and exportable creative bits. The generation route streams **NDJSON** on the Node runtime
  and degrades to seeded fixtures with zero credentials. See [creative-studio](./creative-studio.md).

Verification (fresh run): `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm test`
(**237 passing**, 29 files), and `npm run build` (success - the real integration gate that neither
worker had run). **No build-only fixes were needed**: both workers' Server/Client boundaries were
already clean (client-safe barrel exports, server-only modules imported by explicit path, `runtime =
"nodejs"` on the streaming route). Committed as Conventional Commits and pushed to `origin/main`.

**Wave 4 - Landing Pages + Performance Intelligence (Analytics): DONE, verified, committed.**

Delivered (two parallel workers, integrated in a single pass):
- **Landing Pages** (`src/lib/landing/**`, `src/lib/services/landing.service.ts`,
  `src/components/landing-page/**`, `src/app/(dashboard)/landing-pages/**`, `src/app/lp/[slug]/page.tsx`,
  `src/app/api/leads/**`, `src/app/api/page-views/**`): an AI **landing-page generator** (sections,
  copy, theme) with a deterministic fallback, an in-app **editor/inspector + live preview**, slug
  management, A/B variants, and the **public `/lp/[slug]` route** that captures **leads** and
  **page-views** (UTM + cleaned referrer attribution) through anonymous-insert API routes scoped by the
  deployed-page RLS join. See [landing-pages](./landing-pages.md).
- **Performance Intelligence** (`src/lib/analytics/**`, `src/lib/seed/**`,
  `src/lib/services/analytics.service.ts`, `src/components/analytics/**`,
  `src/app/(dashboard)/analytics/**`): deterministic **90-day seeded metrics** (fatigue curves,
  seasonality, platform behaviors), **aggregation/math** utilities, **anomaly detection**, a
  **daily-brief** generator, and **recommendations**, surfaced through the analytics overview +
  per-campaign drill-down with funnel, time-series, platform-comparison, and creative-correlation
  charts and CSV export. See [analytics](./analytics.md).

Verification (fresh run): `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), `npm test`
(**337 passing**, 42 files), and `npm run build` (success - the real integration gate that neither
worker had run). **No build-only fixes were needed**: both workers' Server/Client boundaries were
already clean (client-safe barrels, server-only modules behind explicit paths, route handlers with
explicit runtime, `/lp/[slug]` dynamically server-rendered). Committed as Conventional Commits and
pushed to `origin/main`.

**All five product modules (Research, Campaigns, Creative Studio, Landing Pages, Performance
Intelligence) plus the Operator agent are now complete, verified, and committed.**

**Wave 5 - Operator tool-wiring + end-to-end orchestration (agent-tools + agent-integration): DONE, verified, committed.**

Delivered (`src/lib/agent/tools/**`, `src/components/agent/artifact-view.tsx`, `src/lib/agent/{prompts,plan,runtime}.ts`,
`src/app/api/operator/chat/route.ts`): **17 typed, Zod-validated module tools** wrapping every module
service (research `research_audience`/`get_personas`; campaign `create_campaign`/`recommend_platforms`/
`suggest_budget`/`list_campaigns`/`get_campaign`; creative `generate_creatives`/`score_creative`/
`regenerate_creative`; landing `build_landing_page`/`deploy_landing_page`; analytics
`get_performance_summary`/`detect_anomalies`/`get_recommendations`/`daily_brief`/`proactive_briefing`),
each **fail-safe** (`runToolSafely` → structured `{ ok:false }`, never throws) and registered idempotently
via `registerModuleTools()` (bootstrapped beside the built-ins in the route). The system prompt now teaches
the **golden path** (research → campaign → creatives → landing → analytics); the runtime step budget was
raised to 16 for the full chain; demo mode runs a scripted golden path that executes the real tools offline.
Rich per-type **artifact cards** were added to the client registry (personas, creative variants with hook
badges + scores, landing preview + live link, analytics summary/anomalies/recommendations, proactive
briefing). Proactive intelligence + improvement loop: `proactive_briefing` fuses brief + anomalies +
recommendations and emits one-tap next-actions that the runtime surfaces as suggestion chips
(`suggestionsFromArtifacts`); `regenerate_creative` repairs the weakest creative. See
[operator-tools](./operator-tools.md) + [ADR 0004](./adr/0004-agent-runtime.md).

Verification (fresh run, committer/integration gate): `npx tsc --noEmit` (0 errors), `npm run lint`
(0 errors), `npm test` (**376 passing**, 43 files - up from 337; +39 in `tools/module-tools.test.ts`),
and `npm run build` (**success** - the real integration gate that the capstone worker had not run).
**No build-only fixes were needed**: the server/client boundary was already clean - tool `execute`
bodies stay server-side (registered via `registerModuleTools()` in the route), domain output is mapped
to flat render-ready shapes in the PURE `tools/artifacts.ts`, and the client artifact registry
(`artifact-view.tsx`) renders the per-type cards. Committed as Conventional Commits and pushed to
`origin/main`.

**Next:** Wave 6 - **Azure AI Foundry client adaptation + live validation** (`gpt-5.3-chat`,
`MAI-Image-2.5` on the OpenAI-compatible `/openai/v1` surface), then **Bright Data Scraping Browser +
live-data validation**, then the **canonical demo seed**, integration/polish, and ship.

---

## Build Wave Plan + File-Claim Map

Waves group work that can proceed in parallel. **Each module owns its directories** (the file-claim
map) so parallel agents don't collide. Shared foundation files (`src/lib/errors.ts`,
`resilience.ts`, `env.ts`, `research/standard-models.ts`, `agent/types.ts`) are **frozen contracts** -
extend via new files, don't rewrite. Serialize all git operations (one committer at a time).

| Wave | Module (plan id) | Owns (file-claim) | Depends on |
|---|---|---|---|
| **0** | Foundation | (done) `src/lib/*` contracts, `supabase/`, shell | - |
| **1** | (done) Operator core (`agent-core`) | `src/lib/agent/runtime.ts`, `src/app/(dashboard)/operator/**`, `src/components/agent/**`, `src/app/api/agent/**` | Wave 0 |
| **1** | (done) Research core (`research-core`) | Bright Data transport in `src/lib/research/brightdata.ts`, `src/lib/research/providers/_shared/**` | Wave 0 |
| **2** | (done) Research providers + AI (`research-providers`, `research-ai`) | `src/lib/research/providers/**`, `analyzer` impl behind `setResearchAnalyzer` | Wave 1 research-core |
| **2** | (done) Research UI (`research-ui`) | `src/components/research/**`, `src/app/(dashboard)/research/**` | Wave 1 |
| **2** | (done) Agent tools (`agent-tools`) | `src/lib/agent/tools/**` (register research first) | Wave 1 |
| **3** | Campaigns (`campaigns`) | `campaign.service` impl, `src/components/campaign/**`, `src/app/(dashboard)/campaigns/**` | Wave 2 |
| **3** | Creative Studio (`creative-*`) | `creative.service` impl, `src/components/creative/**`, `src/app/(dashboard)/creatives/**`, `creative-images` storage | Wave 2 |
| **4** | (done) Landing Pages (`landing-*`) | `landing.service` impl, `src/lib/landing/**`, `src/components/landing-page/**`, `src/app/(dashboard)/landing-pages/**`, `src/app/lp/**`, `src/app/api/leads`, `src/app/api/page-views` | Wave 3 |
| **4** | (done) Performance Intelligence (`analytics-*`) | `analytics.service` impl, `src/lib/analytics/**`, `src/lib/seed/**`, `src/components/analytics/**`, `src/app/(dashboard)/analytics/**` | Wave 3 |
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
| D8 | DB Row/Insert/Update shapes are `type` aliases (not `interface`s) so `SupabaseClient<Database>` infers table types - no per-module remap casts | `src/types/database.ts`, [learnings](./learnings.md) |
| D9 | Bright Data zones centralized + optional, now **live-configured**: Web Unlocker `mcp_unlocker`, SERP `serp_api1`, Scraping Browser WSS (`BRIGHTDATA_BROWSER_WS`) - set in env, **not yet wired into code** | `src/lib/env.ts`, `.env.example` |
| D10 | Operator runs demo-mode without credentials; Research degrades via a 3-layer fallback (live -> enriched -> seeded fixtures) | `src/lib/agent/**`, `src/lib/research/**` |

---

## Risks & Open Questions

| Status | Item | Mitigation / Note |
|---|---|---|
| OPEN | Bright Data Pro (`web_data_*`) may be inactive | Engine degrades to verified free-tier search+scrape; Pro providers gated by `isAvailable()` |
| OPEN | Azure image API version (`gpt-image`) | Likely needs a preview `api-version`; configurable via env (learnings) |
| PARTIAL | Are real credentials in `.env.local`? | Bright Data is live-configured (Web Unlocker `mcp_unlocker`, SERP `serp_api1`, Scraping Browser WSS); still verify Azure/Supabase before live demo / seed |
| OPEN | Bright Data Scraping Browser not yet wired into code | **Carry-forward (Wave 4/5):** wire the Scraping Browser (`puppeteer-core`) into the competitor-ads / social providers + validate a live SERP (`brd_json`) / Unlocker round-trip during integration |
| OPEN | Demo seed realism (90-day analytics) | `analytics-seed` phase: fatigue curves, seasonality, platform behaviors |
| RESOLVED | Git remote | `origin` exists -> https://github.com/Adit-Jain-srm/MediaOS (branch `main`) |
| RESOLVED | Reference repo leaking into build | Excluded in `.gitignore`, `tsconfig`, `eslint`, `.vercelignore` |

---

## Carry-Forward (must address in a later wave)

- **Canonical demo identity (Wave 6 demo-seed).** Modules currently seed the demo under **different**
  campaign ids - the campaign store, Creative Studio, the analytics "adoption" bridge, and landing
  (which reuses creative's demo campaign) don't share one id. The Wave 6 demo-seed **must establish ONE
  canonical seeded campaign id** that research -> creatives -> landing -> analytics all reference, so
  judges see a single coherent campaign instead of several disconnected "demo" campaigns. **Until then,
  analytics adopts creatives into the headline campaign as a bridge** - a deliberate stopgap, not the
  intended design. See [learnings](./learnings.md) (Wave 4).
- **Azure AI Foundry client adaptation (Wave 6).** The provisioned models (`gpt-5.3-chat`,
  `MAI-Image-2.5`) live on the Foundry **OpenAI-compatible `v1` surface**
  (`https://<resource>.services.ai.azure.com/openai/v1`; shared key in git-ignored `.env.local`), but
  `src/lib/ai/azure.ts` still targets **classic** Azure OpenAI (`*.openai.azure.com` + deployment +
  `api-version`). **Env wired, code NOT wired.** Adapt chat to an OpenAI-compatible client
  (model id `gpt-5.3-chat`), adapt `generateImage` to the `MAI-Image-2.5` images/generations endpoint
  (`Authorization: Bearer`, parse `data[0].b64_json` PNG), add the new env keys
  (`AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_CHAT_DEPLOYMENT`, `AZURE_OPENAI_IMAGE_ENDPOINT`,
  `AZURE_AI_PROJECT_ENDPOINT`) to `src/lib/env.ts`, then live-validate both models end to end. See
  [azure-models](./azure-models.md).
- **Bright Data Scraping Browser wiring (Wave 6).** Live-configured in env (Web Unlocker `mcp_unlocker`,
  SERP `serp_api1`, Scraping Browser WSS) but **not yet wired into code**. Wire `puppeteer-core` into
  the competitor-ads / social providers and validate a live SERP (`brd_json`) / Unlocker round-trip.

---

## Change Log

- **2026-06-28** - Wave 0 Foundation baselined: scaffold + tooling, Supabase schema/design
  system/shared contracts, Vitest+Playwright test harness (35 unit tests passing), and full `Docs/`
  set (architecture, ADRs 0001-0004, research-engine, api, runbook, learnings, progress). Committed
  as Conventional Commits and pushed to `origin/main`. See `git log --oneline` for hashes.
- **2026-06-28** - Wave 2 integrated: **Audience Research Intelligence Engine** + **Operator agent**
  (built by two parallel workers) merged in one pass. Fixed the central `Database` typing defect (Row
  shapes -> `type` aliases) so `SupabaseClient<Database>` infers table types, and removed the duplicated
  per-module remap casts; removed the leftover Operator-rail placeholder footer; centralized the Bright
  Data zone env vars. Full gate re-run fresh: `tsc` (0), `lint` (0), `npm test` (**122 passing**, 16
  files), `npm run build` (success). Committed as Conventional Commits and pushed to `origin/main`.
- **2026-06-28** - Wave 3 integrated: **Campaigns** + **Creative Studio** (built by two parallel
  workers) merged in one pass. Full gate re-run fresh: `tsc` (0), `lint` (0), `npm test` (**237
  passing**, 29 files), `npm run build` (success) - **no build-only fixes required** (both workers'
  Server/Client boundaries were already clean). Bright Data is now **live-configured** (Web Unlocker
  `mcp_unlocker`, SERP `serp_api1`, Scraping Browser WSS in env, not yet wired into code). Committed as
  Conventional Commits and pushed to `origin/main`. Next: Wave 4 (Landing Pages + Analytics).
- **2026-06-30** - Wave 4 integrated: **Landing Pages** + **Performance Intelligence (Analytics)**
  (built by two parallel workers) merged in one pass. Full gate re-run fresh: `tsc` (0), `lint` (0),
  `npm test` (**337 passing**, 42 files), `npm run build` (success - the real integration gate that
  neither worker had run) - **no build-only fixes required** (clean Server/Client boundaries; `/lp/[slug]`
  dynamically server-rendered; `/api/leads` + `/api/page-views` route handlers resolve cleanly). This
  completes **all five product modules + the Operator agent**. Logged two learnings (`URL.origin` is the
  string `"null"` for non-HTTP schemes -> the referrer-cleaning fix; per-module independent demo seeding
  drifts campaign ids apart -> need a canonical Wave 6 seed) and a Carry-Forward note. Committed as
  Conventional Commits and pushed to `origin/main`. Next: Wave 5 (Agent tool-wiring + Bright Data
  Scraping Browser + live-data validation).
- **2026-06-30** - Wave 5 integrated (Operator tool-wiring + end-to-end orchestration): **17 typed,
  Zod-validated, fail-safe module tools** wrapping every module service, registered idempotently via
  `registerModuleTools()`; the system prompt now teaches the **golden path** (research → campaign →
  creatives → landing → analytics), the runtime step budget was raised to 16, demo mode runs a scripted
  golden path offline, and rich per-type **artifact cards** + `proactive_briefing`/`suggestionsFromArtifacts`
  wire the improvement loop. Committer/integration gate re-run fresh: `tsc` (0), `lint` (0), `npm test`
  (**376 passing**, 43 files - up from 337), `npm run build` (**success** - the real gate the capstone
  worker had not run) - **no build-only fixes required** (server/client boundary already clean: tool
  `execute` stays server-side, artifacts mapped to flat shapes in PURE `tools/artifacts.ts`, client
  registry renders cards). Added `Docs/operator-tools.md`, an ADR 0004 addendum, and `Docs/azure-models.md`
  (Azure AI Foundry v1 surface - **env wired, code NOT wired**, deferred to Wave 6). Committed as
  Conventional Commits and pushed to `origin/main`. Next: Wave 6 - Azure AI Foundry client adaptation +
  live validation, then Bright Data Scraping Browser + live-data validation, then canonical demo seed,
  integration/polish, ship.
