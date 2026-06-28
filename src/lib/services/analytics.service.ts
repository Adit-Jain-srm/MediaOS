import { NotImplementedError } from "@/lib/errors";
import type { AiInsight, Anomaly, PerformanceMetric, PerformanceMetricInsert } from "@/types/database";

export interface AnalyticsQuery {
  campaignId?: string;
  creativeId?: string;
  platform?: string;
  /** Inclusive ISO date (YYYY-MM-DD). */
  from?: string;
  /** Inclusive ISO date (YYYY-MM-DD). */
  to?: string;
}

/** Roll-up across the queried metric rows. */
export interface AnalyticsSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  cpa: number;
  roas: number;
}

/**
 * Performance metrics, anomalies, and AI insights access. Implemented in the
 * analytics phases; the seeder writes via `insertMetrics`.
 */
export interface AnalyticsService {
  metrics(query: AnalyticsQuery): Promise<PerformanceMetric[]>;
  summary(query: AnalyticsQuery): Promise<AnalyticsSummary>;
  insertMetrics(rows: PerformanceMetricInsert[]): Promise<number>;
  anomalies(campaignId: string): Promise<Anomaly[]>;
  insights(campaignId: string): Promise<AiInsight[]>;
}

const notImplemented = (method: string): never => {
  throw new NotImplementedError(`analyticsService.${method}`, "platform");
};

export const analyticsService: AnalyticsService = {
  async metrics() {
    return notImplemented("metrics");
  },
  async summary() {
    return notImplemented("summary");
  },
  async insertMetrics() {
    return notImplemented("insertMetrics");
  },
  async anomalies() {
    return notImplemented("anomalies");
  },
  async insights() {
    return notImplemented("insights");
  },
};
