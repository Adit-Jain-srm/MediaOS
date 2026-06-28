import type { Metadata } from "next";
import { Megaphone } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Campaigns"
        description="Every campaign is the hub linking research, creatives, landing pages, and analytics across its draft, active, and archived lifecycle."
      />
      <EmptyState
        icon={<Megaphone weight="duotone" className="size-5" />}
        title="No campaigns yet"
        description="The research-powered brief builder and campaign hub will live here. Create your first campaign from the Operator once the module is live."
      />
    </div>
  );
}
