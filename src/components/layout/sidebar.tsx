"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

import { getActiveRoute, NAV_ROUTES } from "@/lib/nav";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const activeRoute = getActiveRoute(pathname);

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
        <Logo collapsed={collapsed} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV_ROUTES.map((route) => {
          const Icon = route.icon;
          const active = activeRoute?.href === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              title={collapsed ? route.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon weight={active ? "fill" : "regular"} className={cn("size-[18px] shrink-0", active && "text-primary")} />
              {!collapsed ? <span className="truncate">{route.label}</span> : null}
              {!collapsed && active ? <span className="ml-auto size-1.5 rounded-full bg-primary" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className={cn("flex items-center gap-1 border-t border-sidebar-border p-2", collapsed ? "flex-col" : "justify-between")}>
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <CaretRight /> : <CaretLeft />}
        </Button>
      </div>
    </aside>
  );
}
