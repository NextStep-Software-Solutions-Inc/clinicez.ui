"use client";

import React, { useState, useMemo } from "react";
import { PhilHealthMemberType, PhilHealthMemberCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Check, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GroupedMultiProps {
  memberTypes: PhilHealthMemberType[];
  value: number[]; // multiple ids
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

type ParentWithChildren = PhilHealthMemberType & { children: PhilHealthMemberType[] };

export default function PhilHealthMemberTypeGroupedMultiSelect({ memberTypes, value, onChange, disabled }: GroupedMultiProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const data = useMemo(() => {
    const parents = memberTypes.filter(m => m.parentId === null);
    const children = memberTypes.filter(m => m.parentId !== null);
    return parents.map<ParentWithChildren>(p => ({
      ...p,
      children: children.filter(c => c.parentId === p.id)
    }));
  }, [memberTypes]);

  const byCategory = (category: PhilHealthMemberCategory) => data.filter(mt => mt.category === category);

  const categories: { key: PhilHealthMemberCategory; label: string; color: string }[] = [
    { key: "DIRECT", label: "Direct Contributors", color: "bg-emerald-500" },
    { key: "INDIRECT", label: "Indirect Contributors", color: "bg-indigo-500" }
  ];

  const toggleExpand = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const isSelected = (id: number) => value.includes(id);

  const setSelected = (ids: number[], selected: boolean) => {
    if (selected) {
      const next = Array.from(new Set([...value, ...ids]));
      onChange(next);
    } else {
      onChange(value.filter(v => !ids.includes(v)));
    }
  };

  const toggleParent = (parent: ParentWithChildren) => {
    const childIds = parent.children.map(c => c.id);
    const allIds = [parent.id, ...childIds];
    const selectedChildren = childIds.filter(isSelected).length;
    const parentSelected = isSelected(parent.id);
    const fullySelected = parentSelected && selectedChildren === childIds.length;
    setSelected(allIds, !fullySelected);
  };

  const toggleChild = (child: PhilHealthMemberType, parent: ParentWithChildren) => {
    setSelected([child.id], !isSelected(child.id));
    // Optional: when all children selected, auto-add parent; when removing a child, remove parent.
    const siblings = parent.children.map(c => c.id);
    const after = !isSelected(child.id) ? [...value, child.id] : value.filter(v => v !== child.id);
    const allSelected = siblings.every(id => after.includes(id));
    if (allSelected && !after.includes(parent.id)) onChange([...after, parent.id]);
    if (!allSelected) onChange(after.filter(id => id !== parent.id));
  };

  const parentState = (p: ParentWithChildren) => {
    const childIds = p.children.map(c => c.id);
    const selectedChildren = childIds.filter(isSelected).length;
    const parentSel = isSelected(p.id);
    if (parentSel && selectedChildren === childIds.length) return "all";
    if ((!parentSel && selectedChildren === 0)) return "none";
    return "partial";
  };

  return (
    <div className={cn("border rounded-md", disabled && "opacity-60 pointer-events-none")}>
      <ScrollArea className="max-h-80 p-2">
        {categories.map(cat => {
          const parents = byCategory(cat.key);
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
                  const state = parentState(parent);
                  const hasChildren = parent.children.length > 0;
                  const expandedRow = expanded[parent.id] || false;
                  return (
                    <li key={parent.id}>
                      <div className={cn("flex items-start gap-1")}>
                        <button
                          type="button"
                          onClick={() => hasChildren ? toggleExpand(parent.id) : toggleParent(parent)}
                          className={cn("mt-1 h-5 w-5 flex items-center justify-center rounded border bg-background", hasChildren && "")}
                        >
                          {hasChildren ? (expandedRow ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : <span className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleParent(parent)}
                          className={cn("flex-1 px-2 py-1 rounded border text-left text-sm", state === "all" ? "border-primary text-primary bg-primary/5" : state === "partial" ? "border-muted-foreground/40 bg-muted/40" : "border-transparent hover:bg-muted/60")}
                        >
                          <span className="inline-flex items-center gap-1">
                            {state === "all" && <Check className="h-3 w-3" />}
                            {state === "partial" && <Minus className="h-3 w-3" />}
                            {parent.name}
                          </span>
                        </button>
                      </div>
                      {hasChildren && expandedRow && (
                        <ul className="mt-1 ml-8 space-y-1">
                          {parent.children.map(child => {
                            const selected = isSelected(child.id);
                            return (
                              <li key={child.id}>
                                <button
                                  type="button"
                                  onClick={() => toggleChild(child, parent)}
                                  className={cn("w-full flex items-center gap-2 rounded px-2 py-1 text-left border text-xs", selected ? "border-primary text-primary bg-primary/5" : "border-transparent hover:bg-muted/60")}
                                >
                                  {selected && <Check className="h-3 w-3" />}
                                  <span className="truncate flex-1">{child.name}</span>
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
        {memberTypes.length === 0 && <p className="text-xs text-muted-foreground p-2">No member types available.</p>}
      </ScrollArea>
      {value.length > 0 && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-2 bg-muted/30">
          {value.map(id => {
            const mt = memberTypes.find(m => m.id === id);
            if (!mt) return null;
            return (
              <Badge key={id} variant="secondary" className="flex items-center gap-1">
                {mt.name}
                <button
                  type="button"
                  className="ml-1 text-[10px] leading-none"
                  onClick={() => setSelected([id], false)}
                >✕</button>
              </Badge>
            );
          })}
          <button
            type="button"
            className="ml-auto underline text-[10px]"
            onClick={() => onChange([])}
          >Clear All</button>
        </div>
      )}
    </div>
  );
}
