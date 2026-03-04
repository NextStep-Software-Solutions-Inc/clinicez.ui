"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

interface Clinic {
  id: string;
  name: string;
  uid: string;
  role?: string;
}

interface ClinicSelectorProps {
  activeClinic: Clinic;
  clinics?: Clinic[];
  onClinicChange?: (clinic: Clinic) => void;
}

export function ClinicSelector({
  activeClinic,
  clinics = [],
  onClinicChange,
}: ClinicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClinicSelect = (clinic: Clinic) => {
    onClinicChange?.(clinic);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Logo */}
      <img
        src="/assets/clinic-ez_mini-logo.svg"
        alt="ClinicEZ"
        className="h-8 w-8 object-contain"
      />

      {/* Clinic Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-foreground/90 truncate max-w-[100px] md:max-w-[160px]">
                {activeClinic.name}
              </p>
              <p className="text-xs text-foreground/50 capitalize">
                {activeClinic.role || "Member"}
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
          {clinics.length > 0 ? (
            clinics.map((clinic) => (
              <DropdownMenuItem
                key={clinic.id}
                onClick={() => handleClinicSelect(clinic)}
                className={`flex items-start gap-3 cursor-pointer ${
                  clinic.id === activeClinic.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {clinic.name}
                  </p>
                  <p className="text-xs text-foreground/60 capitalize">
                    {clinic.role || "Member"}
                  </p>
                </div>
                {clinic.id === activeClinic.id && (
                  <div className="h-2 w-2 rounded-full bg-[var(--dash-accent)] mt-1" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-foreground/60">
              No other clinics available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
