import { isBrightDataConfigured } from "@/lib/env";
import { NotImplementedError } from "@/lib/errors";

/**
 * Bright Data adapter - the interface research providers call to reach the web.
 *
 * Free tier (always available when configured): `searchEngine`,
 * `searchEngineBatch`, `scrapeAsMarkdown`, `scrapeBatch`.
 * Pro tier (degrades gracefully): `webData` for structured platform datasets.
 *
 * The concrete network implementation (Bright Data MCP / Web Unlocker / SERP)
 * is wired in the research-core phase. This file defines the stable contract and
 * a degradable default so providers can be written against it now.
 */

export type BrightDataEngine = "google" | "bing" | "yandex";

export interface BrightDataSearchResult {
  title?: string;
  url: string;
  snippet?: string;
  position?: number;
}

export interface BrightDataSearchResponse {
  query: string;
  engine: BrightDataEngine;
  results: BrightDataSearchResult[];
  raw?: unknown;
}

export interface BrightDataScrapeResponse {
  url: string;
  markdown?: string;
  html?: string;
}

export interface BrightDataRequestContext {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface SearchEngineInput {
  query: string;
  engine?: BrightDataEngine;
  /** e.g. "us", "gb" */
  country?: string;
  /** Number of results to request. */
  count?: number;
}

export interface BrightDataClient {
  /** Whether the API token is present. */
  readonly isConfigured: boolean;
  /** Whether Pro structured datasets (`web_data_*`) are available. */
  isProAvailable(): Promise<boolean>;

  searchEngine(input: SearchEngineInput, ctx?: BrightDataRequestContext): Promise<BrightDataSearchResponse>;
  searchEngineBatch(queries: SearchEngineInput[], ctx?: BrightDataRequestContext): Promise<BrightDataSearchResponse[]>;
  scrapeAsMarkdown(url: string, ctx?: BrightDataRequestContext): Promise<BrightDataScrapeResponse>;
  scrapeBatch(urls: string[], ctx?: BrightDataRequestContext): Promise<BrightDataScrapeResponse[]>;

  /**
   * Pro structured dataset access (e.g. "reddit_posts", "x_posts").
   * Resolves `null` when Pro is unavailable so callers can degrade to
   * search + scrape rather than fail.
   */
  webData(dataset: string, input: Record<string, unknown>, ctx?: BrightDataRequestContext): Promise<unknown | null>;
}

/**
 * Default degradable client. Reports configuration status truthfully and treats
 * Pro as unavailable. Network methods throw a NotImplementedError until the
 * research-core phase wires the Bright Data MCP transport - providers should be
 * authored against the `BrightDataClient` interface so that wiring is the only
 * change needed.
 */
class DegradableBrightDataClient implements BrightDataClient {
  get isConfigured(): boolean {
    return isBrightDataConfigured();
  }

  async isProAvailable(): Promise<boolean> {
    // Pro structured datasets require an active Pro account; default to false so
    // the orchestrator uses the verified free-tier search + scrape path.
    return false;
  }

  async searchEngine(): Promise<BrightDataSearchResponse> {
    throw new NotImplementedError("BrightDataClient.searchEngine (wired in research-core)", "brightdata");
  }

  async searchEngineBatch(): Promise<BrightDataSearchResponse[]> {
    throw new NotImplementedError("BrightDataClient.searchEngineBatch (wired in research-core)", "brightdata");
  }

  async scrapeAsMarkdown(): Promise<BrightDataScrapeResponse> {
    throw new NotImplementedError("BrightDataClient.scrapeAsMarkdown (wired in research-core)", "brightdata");
  }

  async scrapeBatch(): Promise<BrightDataScrapeResponse[]> {
    throw new NotImplementedError("BrightDataClient.scrapeBatch (wired in research-core)", "brightdata");
  }

  async webData(): Promise<unknown | null> {
    // Pro unavailable by default -> null signals callers to degrade gracefully.
    return null;
  }
}

let client: BrightDataClient | null = null;

export function getBrightDataClient(): BrightDataClient {
  if (!client) client = new DegradableBrightDataClient();
  return client;
}

/** Test/seeding hook to inject a concrete implementation. */
export function setBrightDataClient(custom: BrightDataClient): void {
  client = custom;
}
