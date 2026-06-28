import { getBrightDataClient, type BrightDataSearchResponse } from "../brightdata";
import { ResearchProvider, type NormalizedOutput, type ProviderRunContext } from "../provider";
import type { CompetitorAd, QueryParams, SourceCitation, StandardModel, StandardModelKind } from "../standard-models";
import { classifyHooks, dedupeBy, inferCreativeType, inferPlatformFromUrl, toCitation } from "./utils";

/**
 * Competitor Ad Research provider.
 *
 * Bright Data tools: `search_engine` (+ `searchEngineBatch`) over the Meta Ad
 * Library and Google, enriched with `scrape_as_markdown`. Yields `CompetitorAd`
 * standard models: advertiser, copy, the hooks they lean on, and engagement when
 * the snippet exposes it.
 */

type CompetitorAdsQuery = {
  queries: { query: string; country: string }[];
};

export class CompetitorAdsProvider extends ResearchProvider<CompetitorAdsQuery> {
  readonly name = "competitor_ads";
  readonly title = "Competitor Ad Research";
  readonly description = "Active competitor ad creatives, angles, and hooks from the Meta Ad Library and search.";
  readonly produces: ReadonlyArray<StandardModelKind> = ["competitor_ad"];

  transformQuery(params: QueryParams): CompetitorAdsQuery {
    const country = params.region ?? "us";
    const base = params.product ?? params.query;
    const queries = [
      { query: `${base} ads`, country },
      { query: `${base} ad library`, country },
      ...(params.competitors ?? []).map((c) => ({ query: `${c} facebook ads library`, country })),
    ];
    return { queries };
  }

  async extractData(query: CompetitorAdsQuery, ctx: ProviderRunContext): Promise<Record<string, unknown>> {
    const client = getBrightDataClient();
    const responses = await client.searchEngineBatch(query.queries, { signal: ctx.signal });
    return { responses };
  }

  transformData(raw: Record<string, unknown>, params: QueryParams): NormalizedOutput {
    const responses = (raw.responses as BrightDataSearchResponse[] | undefined) ?? [];
    const limit = params.limit ?? 12;

    const items: StandardModel[] = [];
    const sources: SourceCitation[] = [];

    const hits = responses.flatMap((r) => r.results);
    for (const hit of hits) {
      const advertiser = (hit.title ?? "").split(/\s[-|–—]\s|\s\|\s/)[0]?.trim() || undefined;
      const copy = hit.snippet?.trim();
      if (!copy) continue;

      const citation = toCitation(this.name, {
        url: hit.url,
        title: hit.title,
        snippet: copy,
        confidence: 0.7,
      });
      sources.push(citation);

      const ad: CompetitorAd = {
        platform: inferPlatformFromUrl(hit.url),
        advertiser,
        creativeType: inferCreativeType(hit.url),
        copy,
        hooksUsed: classifyHooks(`${hit.title ?? ""} ${copy}`),
        sources: [citation],
      };
      items.push({ kind: "competitor_ad", data: ad });
    }

    const deduped = dedupeBy(items, (i) => (i.kind === "competitor_ad" ? `${i.data.advertiser}|${i.data.copy}` : "")).slice(0, limit);
    return { items: deduped, sources };
  }
}
