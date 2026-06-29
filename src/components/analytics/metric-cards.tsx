import {
  ChartLineUp,
  CursorClick,
  CurrencyDollar,
  Funnel,
  Receipt,
  Target,
} from "@phosphor-icons/react/dist/ssr";

import {
  formatChangePct,
  formatCompact,
  formatCurrency,
  formatMultiplier,
  formatPercent,
  type MetricSummary,
  type SummaryDeltas,
} from "@/lib/analytics";
import { Metric } from "@/components/ui/states";

interface MetricCardsProps {
  summary: MetricSummary;
  deltas: SummaryDeltas;
}

/** Headline metric cards with period-over-period deltas (mono, semantic colors). */
export function MetricCards({ summary, deltas }: MetricCardsProps) {
  const change = (key: keyof SummaryDeltas): number | undefined => {
    const pct = deltas[key]?.changePct;
    return pct === null || pct === undefined ? undefined : pct;
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <Metric label="Spend" value={formatCurrency(summary.spend)} delta={change("spend")} deltaLabel={formatChangePct(deltas.spend.changePct)} icon={<CurrencyDollar weight="duotone" />} />
      <Metric label="Conversions" value={formatCompact(summary.conversions)} delta={change("conversions")} deltaLabel={formatChangePct(deltas.conversions.changePct)} icon={<Target weight="duotone" />} />
      <Metric label="CPA" value={formatCurrency(summary.cpa)} delta={change("cpa")} deltaLabel={formatChangePct(deltas.cpa.changePct)} invertDelta icon={<Receipt weight="duotone" />} />
      <Metric label="CTR" value={formatPercent(summary.ctr)} delta={change("ctr")} deltaLabel={formatChangePct(deltas.ctr.changePct)} icon={<CursorClick weight="duotone" />} />
      <Metric label="CVR" value={formatPercent(summary.cvr)} delta={change("cvr")} deltaLabel={formatChangePct(deltas.cvr.changePct)} icon={<Funnel weight="duotone" />} />
      <Metric label="ROAS" value={formatMultiplier(summary.roas)} delta={change("roas")} deltaLabel={formatChangePct(deltas.roas.changePct)} icon={<ChartLineUp weight="duotone" />} />
    </div>
  );
}
