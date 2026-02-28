"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@lib/utils";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { Separator } from "@components/ui/separator";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Home,
  Users,
  Settings,
  Calendar,
  FileText,
  Building2,
  Activity,
  BarChart3,
  BarChart2,
  Bell,
  ClipboardList,
  Heart,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badgeCount?: number;
  /** When true, only exact pathname match marks this item as active */
  exact?: boolean;
}

export interface DashboardSidebarProps {
  navItems: NavItem[];
  dashboardType: "patient" | "tenant" | "clinic" | "organization";
  title: string;
}

/* ------------------------------------------------------------------ */
/*  Icon mapping                                                       */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  users: Users,
  settings: Settings,
  calendar: Calendar,
  "file-text": FileText,
  building: Building2,
  activity: Activity,
  "bar-chart": BarChart3,
  "bar-chart-2": BarChart2,
  bell: Bell,
  clipboard: ClipboardList,
  heart: Heart,
  stethoscope: Stethoscope,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Home;
}

/* ------------------------------------------------------------------ */
/*  Nav link (shared between desktop + mobile)                         */
/* ------------------------------------------------------------------ */

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function NavLink({ item, isActive, collapsed }: NavLinkProps) {
  const Icon = resolveIcon(item.icon);

  const link = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        isActive && [
          "bg-muted text-[var(--dash-accent)] font-semibold",
          "shadow-sm ring-1 ring-[var(--dash-accent)]/20",
        ],
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{item.name}</span>
          {item.badgeCount !== undefined && item.badgeCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-auto h-5 min-w-5 justify-center px-1.5 text-[0.625rem]",
                isActive && "bg-[var(--dash-accent)]/10 text-[var(--dash-accent)]",
              )}
            >
              {item.badgeCount}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.name}
          {item.badgeCount !== undefined && item.badgeCount > 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                "h-5 px-1.5 text-[0.625rem]",
                isActive && "bg-[var(--dash-accent)]/10 text-[var(--dash-accent)]",
              )}
            >
              {item.badgeCount}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

/* ------------------------------------------------------------------ */
/*  Sidebar content (reused for desktop + sheet)                       */
/* ------------------------------------------------------------------ */

interface SidebarBodyProps {
  navItems: NavItem[];
  title: string;
  pathname: string;
  collapsed: boolean;
  onToggle?: () => void;
}

function SidebarBody({
  navItems,
  title,
  pathname,
  collapsed,
  onToggle,
}: SidebarBodyProps) {
  return (
    <>
      {/* Branding Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between border-b border-border px-4 transition-all",
          collapsed && "justify-center px-2",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-md bg-[var(--dash-accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {title.charAt(0)}
            </div>
            <span className="truncate text-sm font-semibold text-foreground">
              {title}
            </span>
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 hover:bg-muted",
              !collapsed && "ml-auto"
            )}
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border px-3 py-3 text-xs text-muted-foreground">
          <p className="px-2">v1.0.0</p>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile menu trigger + sheet (rendered inside topbar)               */
/* ------------------------------------------------------------------ */

export function MobileMenu({
  navItems,
  dashboardType,
  title,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">{title} navigation</SheetTitle>
        <div className="flex h-full flex-col" data-dashboard={dashboardType}>
          <SidebarBody
            navItems={navItems}
            title={title}
            pathname={pathname}
            collapsed={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export default function DashboardSidebar({
  navItems,
  dashboardType,
  title,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden flex-col border-r border-border bg-background md:flex",
        collapsed ? "w-16" : "w-64",
        "sticky top-0 h-dvh overflow-y-auto transition-all duration-200 ease-in-out",
        "supports-[scrollbar-gutter:stable]:scrollbar-gutter-stable",
      )}
      data-dashboard={dashboardType}
    >
      <SidebarBody
        navItems={navItems}
        title={title}
        pathname={pathname}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
    </aside>
  );
}
