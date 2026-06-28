import type { Metadata } from "next";
import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Analytics"
        description="Cross-platform performance, funnel and creative correlation, and an AI daily brief with anomaly detection feeding the Operator."
      />
      <EmptyState
        icon={<ChartLineUp weight="duotone" className="size-5" />}
        title="No performance data yet"
        description="Metric cards, time-series charts, and AI insights will render here once campaigns have data or the demo seeder runs."
      />
    </div>
  );
}
