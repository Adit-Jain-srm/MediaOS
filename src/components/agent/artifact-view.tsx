"use client";

import Link from "next/link";
import { ArrowUpRight, Stack, TextAlignLeft, Wrench } from "@phosphor-icons/react";

import type { AgentArtifact } from "@/lib/agent/types";
import type {
  CapabilitiesArtifactData,
  ContextSummaryArtifactData,
  NavigationArtifactData,
} from "@/lib/agent/tools";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

/**
 * Renders a tool's artifact by `type`. Acts as the client-side artifact registry:
 * future tools register a richer renderer here (or fall back to the JSON view),
 * mirroring the optional server-side `renderArtifact` hook on `AgentTool`.
 */
export function ArtifactView({ artifact }: { artifact: AgentArtifact }) {
  switch (artifact.type) {
    case "navigation":
      return <NavigationArtifact data={artifact.data as NavigationArtifactData} />;
    case "capabilities":
      return <CapabilitiesArtifact data={artifact.data as CapabilitiesArtifactData} />;
    case "context-summary":
      return <ContextSummaryArtifact data={artifact.data as ContextSummaryArtifactData} />;
    default:
      return <JsonArtifact title={artifact.title} data={artifact.data} />;
  }
}

function ArtifactFrame({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <span className="text-primary [&_svg]:size-3.5">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function NavigationArtifact({ data }: { data: NavigationArtifactData }) {
  return (
    <ArtifactFrame icon={<ArrowUpRight weight="bold" />} title="Navigate">
      <Link href={data.href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-between")}>
        <span>Open {data.label}</span>
        <ArrowUpRight />
      </Link>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{data.href}</p>
    </ArtifactFrame>
  );
}

function CapabilitiesArtifact({ data }: { data: CapabilitiesArtifactData }) {
  return (
    <ArtifactFrame icon={<Wrench weight="fill" />} title={`${data.total} capabilities`}>
      <div className="space-y-2">
        {data.categories.map((category) => (
          <div key={category.name}>
            <div className="mb-1 text-[11px] font-medium text-muted-foreground capitalize">{category.name}</div>
            <div className="flex flex-wrap gap-1">
              {category.tools.map((tool) => (
                <Badge key={tool.name} variant="outline" className="font-mono text-[10px]" title={tool.description}>
                  {tool.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ArtifactFrame>
  );
}

function ContextSummaryArtifact({ data }: { data: ContextSummaryArtifactData }) {
  return (
    <ArtifactFrame icon={<Stack weight="fill" />} title="Working context">
      <p className="text-sm text-foreground/90">{data.note}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
        <Row label="Campaign" value={data.campaignId ?? "none"} />
        <Row label="Conversation" value={data.conversationId ?? "new"} />
        {data.focus ? <Row label="Focus" value={data.focus} /> : null}
      </dl>
    </ArtifactFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-mono text-foreground/80" title={value}>
        {value}
      </dd>
    </>
  );
}

function JsonArtifact({ title, data }: { title: string; data: unknown }) {
  return (
    <ArtifactFrame icon={<TextAlignLeft weight="fill" />} title={title}>
      <pre className="max-h-48 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-[11px] leading-relaxed text-foreground/80">
        {safeStringify(data)}
      </pre>
    </ArtifactFrame>
  );
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
