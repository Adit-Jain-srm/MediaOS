import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Binoculars, Robot, Sparkle } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/states";
import { FadeIn } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Command Center" };

export default function CommandCenterPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Command Center"
        description="Hire the Operator to plan and run campaigns end to end, or drop into a control surface to take the wheel yourself."
      />

      <FadeIn className="grid gap-3 sm:grid-cols-2">
        <Link href="/operator" className="group">
          <Card className="h-full p-4 ring-1 ring-foreground/10 transition-colors hover:bg-card/70">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Robot className="size-5" weight="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-heading text-sm font-medium text-foreground">
                  Open the Operator
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give the agent a goal and watch it research, create, and deploy with cited sources.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/research" className="group">
          <Card className="h-full p-4 ring-1 ring-foreground/10 transition-colors hover:bg-card/70">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Binoculars className="size-5" weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-heading text-sm font-medium text-foreground">
                  Run audience research
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aggregate live web data into personas, pain points, and competitor angles.
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </FadeIn>

      <EmptyState
        icon={<Sparkle weight="duotone" className="size-5" />}
        title="No campaigns yet"
        description="Once the feature modules land, your live campaigns, daily brief, and performance snapshot will surface here."
        action={
          <Link href="/operator" className={cn(buttonVariants({ size: "sm" }))}>
            <Robot />
            Launch with the Operator
          </Link>
        }
      />
    </div>
  );
}
