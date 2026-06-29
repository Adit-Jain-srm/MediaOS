import { DEMO_CAMPAIGN_ID as CAMPAIGN_DEMO_ID } from "@/lib/campaign/store";
import type { CreativeMeta } from "@/lib/analytics/types";
import { buildSeededCreatives, DEMO_CAMPAIGN_NAME } from "@/lib/creative/fixtures";
import type { AdPlatform } from "@/lib/research/standard-models";
import type { Json } from "@/types/database";

import type { SeedCampaignTarget, SeedCreativeTarget } from "./analytics-generator";

/**
 * Seed targets - the bridge between the campaign/creative modules and the
 * analytics seeder. PURE + test-safe (no `next/headers`, no Supabase): it only
 * reads the credential-free creative fixtures and the demo campaign id.
 *
 * Note on demo linkage: the campaign store seeds the headline demo campaign under
 * `demo-campaign-retirement-income`, while the Creative Studio seeds its demo
 * creatives under a separate UUID campaign id (a pre-existing split we cannot
 * edit). For a rich demo we ADOPT those real seeded creatives into the headline
 * demo campaign for analytics purposes - metrics reference the real creative ids,
 * so `creativeService.get(id)` still resolves their labels in the dashboard.
 */

/**
 * Per-creative tuning that makes the demo recommendations pop:
 * - the Meta "no-upsell trust" hero is the low-CPA SCALE candidate
 * - one Meta variant launches late (fresh, no fatigue)
 * - TikTok is the weak laggard (PAUSE candidate)
 * - day-0 creatives accrue fatigue (REFRESH candidates)
 * Keyed by the stable creative-fixture ids.
 */
const DEMO_CREATIVE_TUNING: Record<string, Pick<SeedCreativeTarget, "launchDayOffset" | "quality" | "ctrQuality">> = {
  "d0000000-0000-4000-8000-000000000011": { launchDayOffset: 0, quality: 1.24, ctrQuality: 1.0 }, // Meta hero (scale)
  "d0000000-0000-4000-8000-000000000012": { launchDayOffset: 0, quality: 0.96, ctrQuality: 1.05 },
  "d0000000-0000-4000-8000-000000000013": { launchDayOffset: 42, quality: 1.06, ctrQuality: 1.12 }, // fresh Meta
  "d0000000-0000-4000-8000-000000000021": { launchDayOffset: 0, quality: 1.0, ctrQuality: 1.0 }, // Google
  "d0000000-0000-4000-8000-000000000031": { launchDayOffset: 22, quality: 0.72, ctrQuality: 0.9 }, // TikTok laggard
  "d0000000-0000-4000-8000-000000000041": { launchDayOffset: 0, quality: 1.12, ctrQuality: 1.0 }, // Taboola (anomaly)
  "d0000000-0000-4000-8000-000000000042": { launchDayOffset: 0, quality: 1.0, ctrQuality: 1.0 },
};

/** Best-effort label from a creative's `content` jsonb (angle > headline > type). */
export function labelFromContent(content: Json, platform: string, type: string): string {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const record = content as Record<string, Json | undefined>;
    const angle = typeof record.angle === "string" ? record.angle.trim() : "";
    const headline = typeof record.headline === "string" ? record.headline.trim() : "";
    const pick = angle || headline;
    if (pick) return pick.length > 48 ? `${pick.slice(0, 47)}…` : pick;
  }
  return `${platform.charAt(0).toUpperCase()}${platform.slice(1)} ${type}`;
}

/**
 * The headline demo seed target: the 7 real Creative Studio fixtures adopted into
 * the demo campaign, with tuning applied. Deterministic + synchronous.
 */
export function buildDemoSeedTargets(): SeedCampaignTarget {
  const creatives: SeedCreativeTarget[] = buildSeededCreatives().map((seed) => {
    const tuning = DEMO_CREATIVE_TUNING[seed.id] ?? {};
    return {
      id: seed.id,
      platform: seed.content.platform,
      label: labelFromContent(seed.content as unknown as Json, seed.content.platform, seed.content.format),
      ...tuning,
    };
  });
  return { campaignId: CAMPAIGN_DEMO_ID, name: DEMO_CAMPAIGN_NAME, creatives };
}

/** Creative-label lookup map for the demo (id → label/platform). */
export function buildDemoCreativeMeta(): Map<string, CreativeMeta> {
  const target = buildDemoSeedTargets();
  return new Map(
    target.creatives.map((c) => [c.id, { id: c.id, label: c.label ?? c.id, platform: c.platform } satisfies CreativeMeta]),
  );
}

/** The demo campaign id analytics seeds against (kept in sync with the campaign store). */
export const ANALYTICS_DEMO_CAMPAIGN_ID = CAMPAIGN_DEMO_ID;

/** Platforms covered by the demo creatives (for UI defaults). */
export function demoPlatforms(): AdPlatform[] {
  return [...new Set(buildDemoSeedTargets().creatives.map((c) => c.platform))];
}
