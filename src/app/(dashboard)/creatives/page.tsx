import type { Metadata } from "next";
import { ImagesSquare } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Creatives" };

export default function CreativesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Creatives"
        description="Platform-ready ad copy and visuals, grounded in the exact pain points and language the research engine surfaced."
      />
      <EmptyState
        icon={<ImagesSquare weight="duotone" className="size-5" />}
        title="No creatives yet"
        description="Streaming copy generation, hook analysis, and GPT-Image visuals at the right aspect ratios will land here."
      />
    </div>
  );
}
