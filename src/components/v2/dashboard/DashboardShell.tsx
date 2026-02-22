"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  type NavItem,
} from "./DashboardSidebar";
import { Search, X, Printer } from "lucide-react";
import {
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
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { ThemeToggle } from "@/components/patient-dashboard-v2";
import { ClinicSelector } from "./ClinicSelector";

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
  printer: Printer,
  bell: Bell,
  clipboard: ClipboardList,
  heart: Heart,
  stethoscope: Stethoscope,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Home;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DashboardType = "patient" | "tenant" | "clinic" | "organization";

export interface DashboardShellProps {
  dashboardType: DashboardType;
  navItems: NavItem[];
  title: string;
  subtitle?: string;
  /** Clinic data for selector (optional) */
  activeClinic?: {
    id: string;
    name: string;
    uid: string;
    role?: string;
  };
  /** List of clinics for switching (optional) */
  clinics?: Array<{
    id: string;
    name: string;
    uid: string;
    role?: string;
  }>;
  /** Callback when clinic is changed */
  onClinicChange?: (clinic: { id: string; name: string; uid: string; role?: string }) => void;
  /** Right-side header actions (user button, notifications, etc.) */
  headerActions?: React.ReactNode;
  /** Breadcrumb or navigation context */
  breadcrumb?: React.ReactNode;
  /** Alert or notification banner */
  banner?: React.ReactNode;
  /** Content wrapper className for layout customization */
  contentClassName?: string;
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardShell({
  dashboardType,
  navItems,
  title,
  subtitle,
  activeClinic,
  clinics = [],
  onClinicChange,
  headerActions,
  breadcrumb,
  banner,
  contentClassName = "",
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);


  return (
    <div
      data-dashboard={dashboardType}
      className="flex h-dvh flex-col overflow-hidden bg-background/20"
    >
      {/* ===== SCROLLABLE AREA (Header + Nav + Content) ===== */}
      <div className="flex flex-1 flex-col overflow-y-auto" data-scroll-root>
        {/* ===== HEADER ===== */}
        <header className="z-30 bg-background/20 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-all">
          {/* Desktop Header */}
          <div className="hidden sm:flex h-16 items-center justify-between px-6 gap-6">
          {/* Left: Title/Clinic Section */}
          <div className="flex-1 min-w-0">
            {activeClinic ? (
              <ClinicSelector
                activeClinic={activeClinic}
                clinics={clinics}
                onClinicChange={onClinicChange}
              />
            ) : (
              <>
                <h1 className="text-xl font-bold tracking-tight text-foreground/90 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-foreground/50 mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xs hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent transition-colors" />
              <Input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-sm border-border/50 bg-muted/40 rounded-lg focus:bg-background focus:border-accent focus:ring-accent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {headerActions}
            <ThemeToggle/>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="sm:hidden flex h-14 items-center justify-between px-4 gap-3">
          <div className="flex-1 min-w-0">
            {activeClinic ? (
              <ClinicSelector
                activeClinic={activeClinic}
                clinics={clinics}
                onClinicChange={onClinicChange}
              />
            ) : (
              <h1 className="text-lg font-bold text-foreground/90 truncate">
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="h-8 w-8 rounded-lg hover:bg-muted"
              aria-label="Search"
            >
              {showMobileSearch ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
           <ThemeToggle/>
          </div>
        </div>

        {/* Mobile Search Bar - Shows on demand */}
        {showMobileSearch && (
          <div className="sm:hidden bg-background/50 px-4 py-2 border-b border-border/50">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-8 pl-9 pr-8 text-sm border-border/50 bg-muted/40 rounded-lg focus:bg-background transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 text-foreground/40" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ===== TOP NAVIGATION ===== */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shrink-0 lg:px-6">
        <div className="flex items-center gap-0 h-12 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20">
          {navItems.map((item) => {
            const Icon = resolveIcon(item.icon);
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap border-b-2 border-transparent group flex-shrink-0 ${
                  isActive
                    ? "text-primary border-b-accent"
                    : "text-foreground/60 hover:text-foreground/80"
                }`}
              >
                <Icon className={`h-4 w-4 transition-opacity ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-75"}`} />
                <span>{item.name}</span>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {item.badgeCount}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ===== MAIN LAYOUT ===== */}
        {/* Banner */}
        {banner && (
          <div className="bg-muted/40 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
            {banner}
          </div>
        )}

        {/* Breadcrumb */}
        {breadcrumb && (
          <nav
            className="bg-background/50 px-4 sm:px-6 py-2.5"
            aria-label="Breadcrumb"
          >
            {breadcrumb}
          </nav>
        )}

        {/* Main Content */}
        <main
          className={`bg-background/50 ${
            contentClassName || "px-1 sm:px-2 py-2"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
