import { describe, expect, it } from "vitest";

import {
  HttpBrightDataClient,
  ResilientBrightDataClient,
  parseSerpJson,
  type BrightDataScrapeResponse,
  type BrightDataSearchResponse,
  type SearchEngineInput,
} from "./brightdata";

describe("parseSerpJson", () => {
  it("normalizes organic results, related searches, and people-also-ask", () => {
    const raw = JSON.stringify({
      organic: [
        { link: "https://a.com", title: "A", description: "desc a", rank: 1 },
        { url: "https://b.com", title: "B", snippet: "desc b" },
      ],
      related: ["related one", { query: "related two" }],
      people_also_ask: [{ question: "How?", answer: "Like this." }, "Plain question?"],
    });

    const parsed = parseSerpJson(raw, { query: "retirement", engine: "google" });
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].url).toBe("https://a.com");
    expect(parsed.relatedSearches).toEqual(["related one", "related two"]);
    expect(parsed.peopleAlsoAsk).toEqual([
      { question: "How?", answer: "Like this." },
      { question: "Plain question?" },
    ]);
  });

  it("throws on a non-JSON body", () => {
    expect(() => parseSerpJson("<html>blocked</html>", { query: "x" })).toThrow();
  });
});

describe("HttpBrightDataClient", () => {
  it("posts to Bright Data and parses the SERP JSON body", async () => {
    const fetchMock = async (): Promise<Response> =>
      new Response(JSON.stringify({ organic: [{ link: "https://x.com", title: "X" }] }), { status: 200 });
    const original = globalThis.fetch;
    globalThis.fetch = fetchMock as typeof fetch;
    try {
      const http = new HttpBrightDataClient("token-123");
      const res = await http.searchEngine({ query: "inflation" });
      expect(res.results[0].url).toBe("https://x.com");
    } finally {
      globalThis.fetch = original;
    }
  });
});

/** Minimal fake HTTP client to drive the resilient wrapper without a network. */
function fakeHttp(overrides: {
  search?: (input: SearchEngineInput) => Promise<BrightDataSearchResponse>;
  scrape?: (url: string) => Promise<BrightDataScrapeResponse>;
}): HttpBrightDataClient {
  return {
    isConfigured: true,
    async isProAvailable() {
      return false;
    },
    async searchEngine(input: SearchEngineInput) {
      return overrides.search ? overrides.search(input) : { query: input.query, engine: "google" as const, results: [] };
    },
    async scrapeAsMarkdown(url: string) {
      return overrides.scrape ? overrides.scrape(url) : { url, markdown: "" };
    },
    async searchEngineBatch() {
      return [];
    },
    async scrapeBatch() {
      return [];
    },
    async webData() {
      return null;
    },
  } as unknown as HttpBrightDataClient;
}

describe("ResilientBrightDataClient", () => {
  it("serves seeded fixtures when there is no HTTP client (no token)", async () => {
    const client = new ResilientBrightDataClient(null);
    const search = await client.searchEngine({ query: "near-retirees inflation" });
    expect(search.results.length).toBeGreaterThan(0);
    const scrape = await client.scrapeAsMarkdown("https://www.reddit.com/r/retirement/x");
    expect(scrape.markdown).toBeTruthy();
  });

  it("degrades to fixtures (never throws) when the HTTP call fails", async () => {
    const client = new ResilientBrightDataClient(
      fakeHttp({
        search: async () => {
          throw new Error("boom");
        },
      }),
    );
    const search = await client.searchEngine({ query: "retirement ads" });
    expect(search.results.length).toBeGreaterThan(0);
  });

  it("read-through caches identical queries (no refetch)", async () => {
    let calls = 0;
    const client = new ResilientBrightDataClient(
      fakeHttp({
        search: async (input) => {
          calls += 1;
          return { query: input.query, engine: "google", results: [{ url: "https://x.com", title: "X" }] };
        },
      }),
    );
    await client.searchEngine({ query: "same" });
    await client.searchEngine({ query: "same" });
    expect(calls).toBe(1);
  });

  it("falls back to fixtures when a live result set is empty", async () => {
    const client = new ResilientBrightDataClient(
      fakeHttp({ search: async (input) => ({ query: input.query, engine: "google", results: [] }) }),
    );
    const search = await client.searchEngine({ query: "retirement inflation" });
    expect(search.results.length).toBeGreaterThan(0);
  });
});
