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
  Bell,
  ClipboardList,
  Heart,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface V2NavItem {
  name: string;
  href: string;
  icon: string;
  badgeCount?: number;
}

export interface V2DashboardSidebarProps {
  navItems: V2NavItem[];
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
  item: V2NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function NavLink({ item, isActive, collapsed }: NavLinkProps) {
  const Icon = resolveIcon(item.icon);

  const link = (
    <Link
      href={item.href}
      className={cn(
        "v2-sidebar__nav-item",
        isActive && "v2-sidebar__nav-item--active",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{item.name}</span>
          {item.badgeCount !== undefined && item.badgeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto h-5 min-w-5 justify-center px-1.5 text-[0.625rem]"
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
            <Badge variant="secondary" className="h-5 px-1.5 text-[0.625rem]">
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
  navItems: V2NavItem[];
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
      {/* Branding */}
      <div
        className={cn(
          "flex h-14 items-center gap-2 px-4",
          collapsed && "justify-center px-2",
        )}
      >
        {!collapsed && (
          <span className="truncate text-sm font-semibold">{title}</span>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", !collapsed && "ml-auto")}
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

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export default function V2DashboardSidebar({
  navItems,
  dashboardType,
  title,
}: V2DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "v2-sidebar hidden md:flex",
          collapsed && "v2-sidebar--collapsed",
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

      {/* Mobile sidebar (Sheet) */}
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
    </>
  );
}
