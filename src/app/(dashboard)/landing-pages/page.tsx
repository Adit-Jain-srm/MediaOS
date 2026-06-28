import type { Metadata } from "next";
import { Browsers } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Landing Pages" };

export default function LandingPagesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Landing Pages"
        description="Generate, edit, and deploy public pages to /lp, capture leads to Supabase, and track views, all from one place."
      />
      <EmptyState
        icon={<Browsers weight="duotone" className="size-5" />}
        title="No landing pages yet"
        description="The page generator, live editor, and one-click deploy will live here. Deployed pages are publicly reachable at /lp/[slug]."
      />
    </div>
  );
}
