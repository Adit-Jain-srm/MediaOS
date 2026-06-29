/**
 * MediaOS seeders. Currently the Performance Intelligence analytics seeder; the
 * later demo-seed phase composes these into the full financial-newsletter scenario.
 *
 * - `analytics-generator` is PURE (deterministic, test-safe).
 * - `targets` is PURE (builds seed targets from the credential-free fixtures).
 * - `analytics` (`seedAnalytics`) is SERVER ONLY: it reads real campaign/creative
 *   ids via the services and persists through `analyticsService`.
 */

export { makeRng, type Rng } from "./rng";
export {
  generateMetrics,
  totalSpend,
  type GenerateOptions,
  type GeneratedDataset,
  type InjectedAnomaly,
  type MetricSeed,
  type SeedCampaignTarget,
  type SeedCreativeTarget,
} from "./analytics-generator";
export {
  ANALYTICS_DEMO_CAMPAIGN_ID,
  buildDemoCreativeMeta,
  buildDemoSeedTargets,
  demoPlatforms,
  labelFromContent,
} from "./targets";
export { collectSeedTargets, seedAnalytics, type SeedAnalyticsOptions, type SeedAnalyticsResult } from "./analytics";
