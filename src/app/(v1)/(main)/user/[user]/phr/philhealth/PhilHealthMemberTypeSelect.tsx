"use client";

import * as React from "react";
import { PhilHealthMemberType, PhilHealthMemberCategory } from "@prisma/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue } from "@/components/ui/select";

export interface PhilHealthMemberTypeSelectProps {
  memberTypes: PhilHealthMemberType[];
  value?: number;
  onChange: (id: number | undefined) => void;
  disabled?: boolean;
  loading?: boolean;
}

function groupMemberTypes(memberTypes: PhilHealthMemberType[]) {
  const byParent: Record<number, PhilHealthMemberType[]> = {};
  for (const mt of memberTypes) {
    if (mt.parentId) (byParent[mt.parentId] ||= []).push(mt);
  }
  const categorize = (cat: PhilHealthMemberCategory) => {
    const parents = memberTypes.filter(m => m.category === cat && m.parentId === null);
    return parents.flatMap(parent => {
      const children = (byParent[parent.id] || []).sort((a, b) => a.name.localeCompare(b.name));
      // If parent has children we exclude the parent from selectable list to avoid confusion.
      if (children.length) return children;
      return [parent];
    });
  };
  return { direct: categorize("DIRECT"), indirect: categorize("INDIRECT") };
}

export default function PhilHealthMemberTypeSelect({ memberTypes, value, onChange, disabled, loading }: PhilHealthMemberTypeSelectProps) {
  const grouped = React.useMemo(() => groupMemberTypes(memberTypes), [memberTypes]);
  const handleValueChange = (val: string) => {
    if (val === "") return onChange(undefined);
    const id = Number(val);
    onChange(Number.isNaN(id) ? undefined : id);
  };
  return (
    <Select disabled={disabled || loading} onValueChange={handleValueChange} value={value ? String(value) : undefined}>
      <SelectTrigger aria-label="PhilHealth Member Type">
        <SelectValue placeholder={loading ? "Loading member types..." : "Select member type"} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {loading && <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>}
        {!loading && (
          <>
            <SelectGroup>
              <SelectLabel>Direct Contributors</SelectLabel>
              {grouped.direct.map(mt => (
                <SelectItem key={mt.id} value={String(mt.id)}>
                  {mt.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Indirect Contributors</SelectLabel>
              {grouped.indirect.map(mt => (
                <SelectItem key={mt.id} value={String(mt.id)}>
                  {mt.name}
                </SelectItem>
              ))}
            </SelectGroup>
            {!grouped.direct.length && !grouped.indirect.length && (
              <div className="px-2 py-1 text-xs text-muted-foreground">No member types available</div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
