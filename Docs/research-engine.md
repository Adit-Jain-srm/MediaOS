# Audience Research Intelligence Engine

The research engine is MediaOS's moat: an OpenBB-inspired **"connect once, consume everywhere"**
system that aggregates live web data into a single, normalized, citation-rich result. This page is
the engineering reference - the contract, the moving parts, the Bright Data tiers, and a
step-by-step guide to adding a new provider.

Design rationale: [ADR 0002](./adr/0002-research-provider-abstraction.md). Source:
`src/lib/research/`.

---

## 1. The pieces

| File | Role |
|---|---|
| `standard-models.ts` | The provider-agnostic contract. Zod schemas + inferred types for `AudienceSegment`, `CompetitorAd`, `TrendSignal`, `CommunityInsight`, `PainPoint`, `BuyingTrigger`, `SourceCitation`, `QueryParams`, the tagged `StandardModel` union, and the merged `ResearchResult`. |
| `provider.ts` | The `ResearchProvider` abstract class (the TET Fetcher) + `run()` wrapper. |
| `registry.ts` | `ResearchProviderRegistry` + the shared `researchRegistry` singleton. |
| `orchestrator.ts` | `runResearch()` (parallel execution + progressive streaming) and `mergeProviderResults()` (pure merge). |
| `brightdata.ts` | `BrightDataClient` interface + degradable default + `get/setBrightDataClient()` injection hook. |
| `analyzer.ts` | The GPT-4o analysis layer (`ResearchAnalyzer`): persona synthesis, pain-point extraction, buying-trigger detection, opportunity detection. |

---

## 2. The provider contract (TET)

Every source implements the same **Transform -> Extract -> Transform** pipeline:

```ts
abstract class ResearchProvider<Q extends ProviderQuery, D extends StandardModel> {
  abstract readonly name: string;                          // registry id (unique)
  abstract readonly title: string;                         // UI label
  abstract readonly description: string;
  abstract readonly produces: ReadonlyArray<StandardModelKind>;
  readonly tier: "free" | "pro" = "free";

  abstract transformQuery(params: QueryParams): Q | Promise<Q>;          // T
  abstract extractData(query: Q, ctx: ProviderRunContext): Promise<RawData>; // E (Bright Data)
  abstract transformData(raw: RawData, params: QueryParams): NormalizedOutput<D> | Promise<NormalizedOutput<D>>; // T

  isAvailable(): boolean { return true; }                  // override for Pro-gated sources
  run(params, ctx?): Promise<ProviderResult>;              // runs TET; never throws
}
```

`run()` times the pipeline and **never throws**: on error it returns
`{ provider, items: [], sources: [], status: "failed", error }`, so one bad source can't break an
orchestrated run.

### Standard models carry citations

Every emitted item is a tagged `StandardModel` - `{ kind: "pain_point", data: PainPoint }`, etc. -
and every `data` carries `sources: SourceCitation[]`. This is what lets the UI and the Operator
attribute each claim to real data.

---

## 3. Registry + orchestrator

```ts
// Register once (typically at module load in the research-providers phase):
researchRegistry.register(new SearchIntentProvider());

// Run everything available, streaming results as they return:
const result = await runResearch(
  { query: "near-retirees worried about inflation", region: "us", limit: 25 },
  { onProviderResult: (r) => pushToUI(r) },
);
```

- `runResearch(params, options)` selects providers (explicit `options.providers`, else
  `registry.available()`), runs them with `Promise.all`, fires `onProviderResult` per completion for
  progressive streaming, then merges.
- `mergeProviderResults(params, results)` is a **pure** function that buckets tagged items into the
  aggregated `ResearchResult` (segments, competitorAds, trends, communityInsights, painPoints,
  buyingTriggers), concatenates `sources`, and records a `providerRuns` summary. Being pure, it is
  trivially unit-testable with fixtures - no network.

---

## 4. Bright Data tiers

`brightdata.ts` exposes a `BrightDataClient` interface; providers call it, never the network
directly. `getBrightDataClient()` returns a degradable default; `setBrightDataClient()` injects a
real or fixture implementation (used by tests and seeders - **no live calls in CI**).

| Tier | Methods | Status |
|---|---|---|
| **Free** (always available when a token is set) | `searchEngine`, `searchEngineBatch`, `scrapeAsMarkdown`, `scrapeBatch` | Verified working |
| **Pro** (active account required) | `webData(dataset, input)` for structured platform datasets (`reddit_posts`, `x_posts`, ...) | Degrades: returns `null` when unavailable so callers fall back to search + scrape |

`isProAvailable()` defaults to `false`, so the orchestrator uses the verified free-tier path unless a
real client reports Pro. Pro-gated providers override `tier = "pro"` and `isAvailable()` so the
registry's `available()` filters them out when Pro is off.

---

## 5. How to add a new provider (step by step)

Adding a data source is a localized change - the core, orchestrator, merge, and UI never change.

### Step 1 - implement the TET pipeline

```ts
// src/lib/research/providers/search-intent.ts
import { getBrightDataClient } from "@/lib/research/brightdata";
import { ResearchProvider, type NormalizedOutput, type ProviderRunContext } from "@/lib/research/provider";
import type { QueryParams, SourceCitation, StandardModel, StandardModelKind } from "@/lib/research/standard-models";

interface SearchIntentQuery {
  terms: string[];
  country: string;
}

export class SearchIntentProvider extends ResearchProvider<SearchIntentQuery> {
  readonly name = "search_intent";
  readonly title = "Search Intent";
  readonly description = "Rising topics and demand signals from SERPs.";
  readonly produces: ReadonlyArray<StandardModelKind> = ["trend_signal"];
  // free tier is the default; no override needed.

  // T - map provider-agnostic params into this provider's query shape.
  transformQuery(params: QueryParams): SearchIntentQuery {
    return {
      terms: [params.query, ...(params.competitors ?? [])],
      country: params.region ?? "us",
    };
  }

  // E - fetch raw data via the injected Bright Data client.
  async extractData(query: SearchIntentQuery, ctx: ProviderRunContext): Promise<Record<string, unknown>> {
    const client = getBrightDataClient();
    const responses = await client.searchEngineBatch(
      query.terms.map((q) => ({ query: q, country: query.country })),
      { signal: ctx.signal },
    );
    return { responses };
  }

  // T - normalize raw data into standard models + citations.
  transformData(raw: Record<string, unknown>, params: QueryParams): NormalizedOutput {
    const responses = (raw.responses ?? []) as { query: string; results: { url: string; title?: string }[] }[];
    const items: StandardModel[] = [];
    const sources: SourceCitation[] = [];

    for (const res of responses) {
      const citations: SourceCitation[] = res.results.slice(0, params.limit ?? 10).map((r) => ({
        provider: this.name,
        url: r.url,
        title: r.title,
        fetchedAt: new Date().toISOString(),
      }));
      sources.push(...citations);
      items.push({
        kind: "trend_signal",
        data: { topic: res.query, timeSeries: [], sources: citations },
      });
    }

    return { items, sources };
  }
}
```

### Step 2 - register it

```ts
// src/lib/research/providers/index.ts (the research-providers phase)
import { researchRegistry } from "@/lib/research/registry";
import { SearchIntentProvider } from "./search-intent";

researchRegistry.register(new SearchIntentProvider());
```

### Step 3 - (Pro-only sources) gate availability

```ts
export class RedditProProvider extends ResearchProvider {
  readonly tier = "pro" as const;
  override isAvailable(): boolean {
    return false; // flip on once Pro `web_data_*` is confirmed active
  }
  // ...TET using getBrightDataClient().webData("reddit_posts", ...)
}
```

### Step 4 - test it with fixtures (no network)

```ts
import { setBrightDataClient } from "@/lib/research/brightdata";

setBrightDataClient(fakeClientReturningFixtures);
const result = await new SearchIntentProvider().run({ query: "inflation" });
expect(result.status).toBe("success");
expect(result.items[0].kind).toBe("trend_signal");
```

That's it. The orchestrator picks the provider up via `registry.available()`, runs it in parallel
with the others, and `mergeProviderResults` files its `trend_signal` items into
`ResearchResult.trends` with their citations.

---

## 6. AI analysis layer

After providers return normalized data, the `ResearchAnalyzer` (`analyzer.ts`, GPT-4o, wired in the
research-ai phase) turns it into actionable intelligence: `synthesizePersonas`, `extractPainPoints`,
`detectBuyingTriggers`, `detectOpportunities` (high-pain/low-competition, pre-saturation trends,
messaging gaps, audience expansion) - each carrying citations. Like Bright Data, it is injectable
(`get/setResearchAnalyzer`) so tests use a deterministic stub. The current default is a stub that
throws `NotImplementedError` until the real analyzer is installed.
