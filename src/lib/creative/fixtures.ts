import type { AdPlatform } from "@/lib/research/standard-models";
import type { AspectRatio } from "@/lib/validators/creative";

import { assembleVariant, type RawByRole } from "./assemble";
import { buildPlaceholderImage } from "./visuals";
import type { CreativeContent } from "./types";

/**
 * Seeded Creative Studio fixtures for the financial-newsletter vertical
 * ("Retirement Income Weekly"). These power the credential-free demo: realistic,
 * platform-ready DR copy across Google / Meta / TikTok / Taboola, each built
 * through the same `assembleVariant` pipeline (so hooks, scores, and limit flags
 * are real, not faked) and grouped into A/B sets.
 */

/**
 * Stable, VALID-UUID ids so the seeded studio resolves across cold starts AND
 * passes the shared `z.uuid()` validators (`creativeRequestSchema.campaignId`,
 * `imageRequestSchema.creativeId`). Human-readable suffixes encode the platform.
 */
export const DEMO_CAMPAIGN_ID = "d0000000-0000-4000-8000-000000000000";
export const DEMO_CAMPAIGN_NAME = "Retirement Income Weekly";

/** Pain points the demo copy targets (mirrors the research engine's fixtures). */
export const DEMO_PAIN_POINTS = [
  "Inflation eroding savings before retirement",
  "Distrust of upsell-heavy newsletters",
  "Fear of not affording to retire on time",
  "Overwhelmed by financial jargon",
];

const DEMO_VOCAB = ["nest egg", "plain-English", "no-upsell", "near-retirees", "inflation", "income"];

export interface DemoCreativeSeed {
  id: string;
  content: CreativeContent;
  /** Aspect ratios to seed a placeholder image for (demo gallery). */
  aspectRatios: AspectRatio[];
}

interface SeedSpec {
  id: string;
  platform: AdPlatform;
  byRole: RawByRole;
  angle: string;
  batchId: string;
  aspectRatios: AspectRatio[];
}

const SEED_SPECS: SeedSpec[] = [
  // --- Meta A/B set: three hooks for the same angle -------------------------
  {
    id: "d0000000-0000-4000-8000-000000000011",
    platform: "meta",
    angle: "No-upsell trust",
    batchId: "demo-meta-trust",
    aspectRatios: ["1:1"],
    byRole: {
      primary_text: [
        "Tired of retirement newsletters that bait you with a 'secret' pick then upsell? Get the plain-English, no-upsell income plan near-retirees actually trust.",
      ],
      headline: ["The No-Upsell Retirement Plan"],
      description: ["No jargon. No hype."],
    },
  },
  {
    id: "d0000000-0000-4000-8000-000000000012",
    platform: "meta",
    angle: "No-upsell trust",
    batchId: "demo-meta-trust",
    aspectRatios: ["9:16"],
    byRole: {
      primary_text: [
        "Inflation is quietly eating your nest egg while newsletters sell you hype. Here is the plain-English plan to protect your retirement income in 2026.",
      ],
      headline: ["Protect Your Nest Egg"],
      description: ["Free 2026 income guide"],
    },
  },
  {
    id: "d0000000-0000-4000-8000-000000000013",
    platform: "meta",
    angle: "No-upsell trust",
    batchId: "demo-meta-trust",
    aspectRatios: [],
    byRole: {
      primary_text: [
        "Join thousands of near-retirees who ditched the hype. A simple, transparent income plan built for people who hate Wall Street jargon.",
      ],
      headline: ["Income That Outpaces Inflation"],
      description: ["Trusted by near-retirees"],
    },
  },
  // --- Google RSA ----------------------------------------------------------
  {
    id: "d0000000-0000-4000-8000-000000000021",
    platform: "google",
    angle: "Inflation protection",
    batchId: "demo-google-income",
    aspectRatios: ["1.91:1"],
    byRole: {
      headline: [
        "Beat Inflation in Retirement",
        "Plain-English Income Plan",
        "Protect Your Nest Egg",
        "No Hype. Just a Real Plan.",
        "Retire Without the Fear",
        "Free 2026 Income Guide",
      ],
      description: [
        "Inflation is quietly eroding your savings. Get the plain-English plan to protect it.",
        "Trusted, no-upsell retirement income guidance built for near-retirees. Download free.",
        "Income strategies that aim to keep pace with rising prices. No jargon, no gimmicks.",
      ],
      path: ["income", "2026-guide"],
    },
  },
  // --- TikTok --------------------------------------------------------------
  {
    id: "d0000000-0000-4000-8000-000000000031",
    platform: "tiktok",
    angle: "Inflation fear",
    batchId: "demo-tiktok-fear",
    aspectRatios: ["9:16"],
    byRole: {
      hook: ["If you are 60 and worried inflation will outlast your savings, watch this before you retire."],
      caption: ["The plain-English retirement plan no one is upselling you."],
      overlay: ["Inflation vs your nest egg"],
      cta: ["Get the guide"],
    },
  },
  // --- Taboola -------------------------------------------------------------
  {
    id: "d0000000-0000-4000-8000-000000000041",
    platform: "taboola",
    angle: "Contrarian curiosity",
    batchId: "demo-taboola-curiosity",
    aspectRatios: ["1:1"],
    byRole: {
      headline: ["The 'Safe' 4% Rule Could Leave Retirees Short by 75"],
      branding: ["Retirement Income Weekly"],
      description: ["A former analyst explains the plain-English income plan built for people who hate Wall Street jargon."],
    },
  },
  {
    id: "d0000000-0000-4000-8000-000000000042",
    platform: "taboola",
    angle: "Contrarian curiosity",
    batchId: "demo-taboola-curiosity",
    aspectRatios: [],
    byRole: {
      headline: ["Why Near-Retirees Are Quietly Ditching Dividend Picks"],
      branding: ["Retirement Income Weekly"],
      description: ["The inflation-era income shift most newsletters are too slow to mention."],
    },
  },
];

/** Builds the seeded creatives via the real assembly pipeline (hooks + scores). */
export function buildSeededCreatives(): DemoCreativeSeed[] {
  return SEED_SPECS.map((spec) => ({
    id: spec.id,
    aspectRatios: spec.aspectRatios,
    content: assembleVariant(spec.platform, spec.byRole, {
      angle: spec.angle,
      batchId: spec.batchId,
      painPointsTargeted: DEMO_PAIN_POINTS.slice(0, 2),
    }),
  }));
}

export interface DemoImageSeed {
  creativeId: string;
  platform: AdPlatform;
  aspectRatio: AspectRatio;
  storagePath: string;
  promptUsed: string;
}

/** Placeholder image seeds (data-URL SVGs) so the demo gallery isn't empty. */
export function buildSeededImages(seeds: DemoCreativeSeed[]): DemoImageSeed[] {
  const images: DemoImageSeed[] = [];
  for (const seed of seeds) {
    for (const ratio of seed.aspectRatios) {
      images.push({
        creativeId: seed.id,
        platform: seed.content.platform,
        aspectRatio: ratio,
        storagePath: buildPlaceholderImage(ratio, seed.content.headline || DEMO_CAMPAIGN_NAME, "Add Azure to generate"),
        promptUsed: `Seeded preview - ${seed.content.angle ?? DEMO_CAMPAIGN_NAME}`,
      });
    }
  }
  return images;
}

export { DEMO_VOCAB };
