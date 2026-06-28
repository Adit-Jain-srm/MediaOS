# Learnings

Dated, append-only log of non-obvious fixes and gotchas. Format: **Problem -> Root cause -> Rule.**
Never repeat a class of mistake twice.

---

## 2026-06-28 - Foundation

### Next.js 16 route-protection middleware is `src/proxy.ts`
- **Problem:** A conventional `src/middleware.ts` exporting `middleware()` did not run.
- **Root cause:** Next.js 16 renames the route-interception convention to **`proxy.ts`** exporting a
  `proxy(request)` function (with the same `config.matcher` shape).
- **Rule:** Put route protection in `src/proxy.ts` / `export async function proxy(...)`. Don't
  reintroduce `middleware.ts`.

### shadcn `base-nova` generates **Base UI**, not Radix
- **Problem:** Components imported from `@radix-ui/*` weren't installed / didn't match generated code.
- **Root cause:** We use the shadcn **`base-nova`** registry, which builds on **Base UI**
  (`@base-ui/react`), the successor to Radix - different package and a few different prop/slot names.
- **Rule:** Import primitives from `@base-ui/react`. When adding shadcn components, use the
  `base-nova` registry; don't assume Radix APIs or `@radix-ui/*` imports.

### Azure `gpt-image` needs a preview API version
- **Problem:** Image generation failed on the GA chat API version while chat worked.
- **Root cause:** Azure OpenAI image deployments often require a **preview** `api-version` distinct
  from the GA version used for chat.
- **Rule:** Keep `AZURE_OPENAI_API_VERSION` flexible; if images 400, switch to a preview version
  (e.g. `2025-04-01-preview`). Documented in `.env.example` and the runbook.

### RLS anonymous-insert must be constrained by a deployed-page join
- **Problem:** Public landing pages need anonymous lead/page-view inserts, but a naive
  `to anon ... with check (true)` lets anyone forge rows for any user/page.
- **Root cause:** Anonymous writers have no `auth.uid()` to scope against.
- **Rule:** Gate anonymous `insert` with `exists (select 1 from landing_pages lp where lp.id =
  landing_page_id and lp.status = 'deployed' and lp.user_id = <table>.user_id)`. Keep
  read/update/delete owner-only. See [ADR 0003](./adr/0003-rls-strategy.md).

### `Reference-repo/` must be excluded from every toolchain
- **Problem:** The OpenBB Python reference repo could be linted/type-checked/built/deployed, breaking
  CI and bloating the bundle.
- **Root cause:** Default globs (`**/*`) sweep it into git, tsc, eslint, and Next file tracing.
- **Rule:** Exclude `Reference-repo/` in `.gitignore`, `tsconfig.json` (`exclude`),
  `eslint.config.mjs` (`globalIgnores`), and `.vercelignore`. Study it for ideas only; never ship it.

### Parallel agents must not run git concurrently (`index.lock`)
- **Problem:** Concurrent `git add`/`commit` from multiple subagents corrupts `.git/index.lock`.
- **Root cause:** Git takes a single index lock; simultaneous writers collide.
- **Rule:** Serialize git. Either commit sequentially after each unit completes, or designate one
  "committer" agent. Never run two git mutations at once.

### PowerShell is the shell - no `head`/`tail`/`grep`/`cat`
- **Problem:** `git log ... | head` failed: `head` is not a cmdlet.
- **Root cause:** The dev environment is Windows PowerShell, not bash.
- **Rule:** Use PowerShell-native equivalents (`Select-Object -First N`) or the editor's dedicated
  read/search tools. Don't pipe through Unix-only utilities.

### Zod v4 uses top-level string-format validators
- **Problem:** Mixing `z.string().email()` style with v4 APIs.
- **Root cause:** Zod v4 exposes `z.email()`, `z.uuid()`, `z.url()` as top-level validators.
- **Rule:** Use `z.email()` / `z.uuid()` / `z.url()` (matching the existing validators) for new
  schemas to stay consistent.

### Test/e2e/config files are type-checked by `next build`
- **Problem:** Worry that adding `*.test.ts`, `e2e/*.spec.ts`, and `*.config.ts` could break build.
- **Root cause:** `tsconfig.json` includes `**/*.ts`, and `next build` runs a full type check over
  included files (not just bundled ones).
- **Rule:** Keep every added TS file (tests, e2e specs, Vitest/Playwright configs) strictly typed and
  lint-clean - import test globals explicitly from `vitest` / `@playwright/test` rather than relying
  on ambient globals.

### Vitest + cached env loader: reset modules per case
- **Problem:** `getEnv()` caches its result, so `vi.stubEnv` after first call had no effect.
- **Root cause:** `src/lib/env.ts` memoizes the parsed env in a module-level variable.
- **Rule:** In env tests, `vi.stubEnv(...)` then `await import("./env")` and `vi.resetModules()` in
  `afterEach` so each case re-evaluates the module against fresh env.

---

## 2026-06-28 - Wave 2 (Research Engine + Operator agent) integration

### supabase-js resolves every table to `never` when DB rows are `interface`s
- **Problem:** With `SupabaseClient<Database>`, every `.from(table)` query typed Row/Insert/Update as
  `never`, so each module added a homomorphic mapped-type "remap" cast to recover working table types.
- **Root cause:** supabase-js's `GenericTable` requires `Row`/`Insert`/`Update` to extend
  `Record<string, unknown>`. TypeScript gives **object-literal `type` aliases and mapped types an
  implicit index signature but withholds it from `interface`s** (which stay open to declaration
  merging). Because the `Row` shapes were `interface`s, no table satisfied `GenericTable`, the `public`
  schema failed `GenericSchema`, and the client's `Schema` generic collapsed to `never`
  (`Schema = Database['public'] extends GenericSchema ? ... : never`).
- **Rule:** Author hand-written Supabase Row/Insert/Update shapes as **`type` aliases, never
  `interface`s**. Keep `src/types/database.ts` as the single source of truth so no module needs a cast.

### Fix the shared contract centrally when parallel workers converge on the same workaround
- **Problem:** Both Wave 2 workers (research `store.ts`, agent `persistence.ts`) independently added the
  *same* `Indexed<>/RemapTable<>` cast to dodge the `never` tables - duplicated, load-bearing type
  gymnastics in two files.
- **Root cause:** Each worker treated `database.ts` as frozen and patched locally instead of fixing the
  shared contract.
- **Rule:** When two independent modules invent the same workaround for a shared-contract defect, treat
  that as the signal to fix the contract at integration and delete the local casts - don't let the
  workaround calcify into N copies.

### `next build` is the real integration gate - not tsc/lint/test
- **Problem:** `tsc --noEmit`, `npm run lint`, and `npm test` were all green, yet none of them exercise
  the React Server/Client boundary or route/RSC bundling that only `next build` enforces.
- **Root cause:** Vitest runs in a node env, and tsc/eslint don't model the Server/Client boundary,
  `"use client"`/`"use server"` directives, or edge/node runtime selection - a client component can
  import server-only code (e.g. `next/headers`) and still pass all three checks.
- **Rule:** Always run `npm run build` as the final gate before declaring integration done. A green
  tsc/lint/test is necessary but not sufficient.
