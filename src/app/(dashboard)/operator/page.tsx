import type { Metadata } from "next";
import { Robot } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Operator" };

export default function OperatorPage() {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Operator"
        description="The full-screen home of your AI media buyer. Plan, execute, monitor, and improve campaigns in one conversation."
      />
      <EmptyState
        className="flex-1"
        icon={<Robot weight="duotone" className="size-5" />}
        title="The Operator agent is being wired up"
        description="This is where goal-to-plan decomposition, live tool calls, and streamed artifacts will render. The right rail hosts a compact version of the same agent."
      />
    </div>
  );
}
