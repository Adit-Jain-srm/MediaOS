import type { Metadata } from "next";
import { Binoculars } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Research"
        description="The audience research intelligence engine: competitor ads, search intent, community pain points, news, and social, aggregated and synthesized into personas."
      />
      <EmptyState
        icon={<Binoculars weight="duotone" className="size-5" />}
        title="No research projects yet"
        description="The research workspace will stream provider results in real time and synthesize cited personas. Kick one off from the Operator or here once the engine is live."
      />
    </div>
  );
}
