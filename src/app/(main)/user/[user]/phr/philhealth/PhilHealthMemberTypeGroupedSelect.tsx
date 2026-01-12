"use client";

import React, { useState } from "react";
import { PhilHealthMemberType, PhilHealthMemberCategory } from "@prisma";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GroupedSelectorProps {
  memberTypes: PhilHealthMemberType[];
  value: number[];              // at most one id (we still use array to match existing form schema)
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

type ParentWithChildren = PhilHealthMemberType & { children: PhilHealthMemberType[] };

export default function PhilHealthMemberTypeGroupedSelect({ memberTypes, value, onChange, disabled }: GroupedSelectorProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const byCategory = (category: PhilHealthMemberCategory) => {
    const parents = memberTypes.filter(mt => mt.category === category && mt.parentId === null);
    return parents.map<ParentWithChildren>(p => ({
      ...p,
      children: memberTypes.filter(c => c.parentId === p.id)
    }));
  };

  const categories: { key: PhilHealthMemberCategory; label: string; color: string }[] = [
    { key: "DIRECT", label: "Direct Contributors", color: "bg-emerald-500" },
    { key: "INDIRECT", label: "Indirect Contributors", color: "bg-indigo-500" }
  ];

  const selectedId = value[0];

  const toggle = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const select = (id: number) => {
    if (disabled) return;
    if (selectedId === id) return;
    onChange([id]);
  };

  return (
    <div className={cn("border rounded-md", disabled && "opacity-60 pointer-events-none")}>
      <ScrollArea className="max-h-72 p-2">
        {categories.map(cat => {
          const parents = byCategory(cat.key as PhilHealthMemberCategory);
          if (!parents.length) return null;
          return (
            <div key={cat.key} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("inline-block w-2 h-2 rounded-full", cat.color)} />
                <h4 className="text-sm font-semibold tracking-tight">{cat.label}</h4>
                <Badge variant="outline" className="ml-auto text-[10px] uppercase">{parents.length}</Badge>
              </div>
              <ul className="space-y-1">
                {parents.map(parent => {
                  const hasChildren = parent.children.length > 0;
                  const isExpanded = expanded[parent.id] || false;
                  const isSelected = selectedId === parent.id;
                  return (
                    <li key={parent.id}>
                      <button
                        type="button"
                        onClick={() => hasChildren ? toggle(parent.id) : select(parent.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded px-2 py-1 text-left border",
                          hasChildren && "bg-muted/40",
                          isSelected && !hasChildren && "border-primary text-primary",
                          !isSelected && "border-transparent hover:bg-muted/60"
                        )}
                      >
                        {hasChildren && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                        <span className="text-sm font-medium flex-1">{parent.name}</span>
                        {!hasChildren && isSelected && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
                      </button>
                      {hasChildren && isExpanded && (
                        <ul className="mt-1 ml-5 space-y-1">
                          {parent.children.map(child => {
                            const childSelected = selectedId === child.id;
                            return (
                              <li key={child.id}>
                                <button
                                  type="button"
                                  onClick={() => select(child.id)}
                                  className={cn(
                                    "w-full flex items-center gap-2 rounded px-2 py-1 text-left border",
                                    childSelected ? "border-primary text-primary bg-primary/5" : "border-transparent hover:bg-muted/60"
                                  )}
                                >
                                  <span className="text-xs font-medium flex-1">{child.name}</span>
                                  {childSelected && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {memberTypes.length === 0 && (
          <p className="text-xs text-muted-foreground p-2">No member types available.</p>
        )}
      </ScrollArea>
    </div>
  );
}
