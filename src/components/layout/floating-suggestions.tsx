"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";

interface Suggestion {
  label: string;
  href: string;
}

const SUGGESTIONS_BY_PATH: Record<string, Suggestion[]> = {
  "/": [
    { label: "Run audience research", href: "/research" },
    { label: "Generate creatives", href: "/creatives" },
    { label: "Check analytics", href: "/analytics" },
  ],
  "/research": [
    { label: "Build a campaign brief", href: "/campaigns" },
    { label: "Generate creatives from findings", href: "/creatives" },
  ],
  "/campaigns": [
    { label: "Generate ad creatives", href: "/creatives" },
    { label: "Build a landing page", href: "/landing-pages" },
  ],
  "/creatives": [
    { label: "Deploy a landing page", href: "/landing-pages" },
    { label: "View performance analytics", href: "/analytics" },
  ],
  "/landing-pages": [
    { label: "Check conversion analytics", href: "/analytics" },
    { label: "Generate more creatives", href: "/creatives" },
  ],
  "/analytics": [
    { label: "Refresh weak creatives", href: "/creatives" },
    { label: "Run new research", href: "/research" },
  ],
};

function matchSuggestions(pathname: string): Suggestion[] {
  if (SUGGESTIONS_BY_PATH[pathname]) return SUGGESTIONS_BY_PATH[pathname];
  for (const [key, value] of Object.entries(SUGGESTIONS_BY_PATH)) {
    if (key !== "/" && pathname.startsWith(key)) return value;
  }
  return SUGGESTIONS_BY_PATH["/"] ?? [];
}

export function FloatingSuggestions() {
  const pathname = usePathname();
  const suggestions = matchSuggestions(pathname);

  if (suggestions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 sm:block">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
        <Sparkle weight="fill" className="size-3.5 shrink-0 text-primary" />
        {suggestions.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
