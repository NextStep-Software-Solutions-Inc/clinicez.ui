"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

interface Org {
  id: number;
  name: string;
  orgUid: string;
  role?: string;
}

interface OrgSelectorProps {
  activeOrg: Org;
  orgs?: Org[];
}

export function OrgSelector({ activeOrg, orgs = [] }: OrgSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleOrgSelect = (org: Org) => {
    setIsOpen(false);
    router.push(`/v2/org/${org.orgUid}`);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Logo */}
      <Link href="/" aria-label="Go to home page">
        <img
          src="/assets/clinic-ez_mini-logo.svg"
          alt="ClinicEZ"
          className="h-8 w-8 object-contain"
        />
      </Link>

      {/* Org Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-foreground/90 truncate max-w-[120px] md:max-w-[200px]">
                {activeOrg.name}
              </p>
              <p className="text-xs text-foreground/50 capitalize">
                {activeOrg.role || "Member"}
              </p>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-foreground/60 group-hover:text-foreground/80 transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-foreground/60 group-hover:text-foreground/80 transition-colors" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-background border border-border">
          {orgs.length > 0 ? (
            orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgSelect(org)}
                className={`flex items-start gap-3 cursor-pointer ${
                  org.id === activeOrg.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {org.name}
                  </p>
                  <p className="text-xs text-foreground/60 capitalize">
                    {org.role || "Member"}
                  </p>
                </div>
                {org.id === activeOrg.id && (
                  <div className="h-2 w-2 rounded-full bg-[var(--dash-accent)] mt-1" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-foreground/60">
              No other organizations available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
