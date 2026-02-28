"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@lib/utils";
import { Input } from "@components/ui/input";
import { Search, X, Sun, Moon } from "lucide-react";
import { Button } from "@components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DashboardTopbarProps {
  title: string;
  subtitle?: string;
  /** Right-side actions (e.g. user avatar dropdown) */
  children?: React.ReactNode;
  /** Mobile menu trigger rendered from the sidebar Sheet */
  mobileMenuTrigger?: React.ReactNode;
  /** Show search bar */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search callback */
  onSearch?: (query: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardTopbar({
  title,
  subtitle,
  children,
  mobileMenuTrigger,
  showSearch = true,
  searchPlaceholder = "Search…",
  onSearch,
}: DashboardTopbarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" />
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-all">
      {/* Desktop Layout */}
      <div className="hidden sm:flex h-16 items-center justify-between px-6 gap-4">
        {/* Left: Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold leading-tight text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Center: Search */}
        {showSearch && (
          <div className="flex-1 max-w-sm">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-[var(--dash-accent)] transition-colors" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearching(true)}
                onBlur={() => setIsSearching(false)}
                className="h-9 pl-9 pr-8 text-sm border-border focus:border-[var(--dash-accent)] focus:ring-[var(--dash-accent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right: Theme Toggle + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </Button>
          {children}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden flex h-16 items-center justify-between px-4 gap-3">
        {/* Mobile Menu Trigger */}
        <div className="flex-shrink-0">{mobileMenuTrigger}</div>

        {/* Mobile Title (truncated on small screens) */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>

        {/* Mobile Actions: Theme + User Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </Button>
          {children}
        </div>
      </div>

      {/* Mobile Search Bar (shown when focused) */}
      {showSearch && isSearching && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="h-9 pl-9 pr-8 text-sm border-border focus:border-[var(--dash-accent)] focus:ring-[var(--dash-accent)]"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
