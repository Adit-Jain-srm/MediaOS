import type { Metadata } from "next";
import { Browsers } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Landing Page" };

/**
 * Public landing page route. The Landing Page Engine fills this in: fetch the
 * deployed page by slug, render its sections, capture leads, and record views.
 * Lives outside the (dashboard) group so it has no app chrome and stays public.
 */
export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 py-16 text-center">
      <div className="grid size-11 place-items-center rounded-lg bg-primary/15 text-primary">
        <Browsers className="size-5" weight="duotone" />
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold text-foreground">Landing page coming soon</h1>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          The page <span className="font-mono text-foreground">/lp/{slug}</span> will be generated and deployed by the
          Landing Page Engine, with on-page lead capture and view analytics.
        </p>
      </div>
      <p className="max-w-md text-xs text-pretty text-muted-foreground">
        Advertising disclosure: content may include paid promotions. Any results shown are illustrative and not
        guaranteed.
      </p>
    </div>
  );
}
