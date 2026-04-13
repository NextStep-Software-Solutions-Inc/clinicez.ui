"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Check } from "lucide-react";
import SearchPaginatedList from "../SearchPaginatedList";
import ClinicCard from "./ClinicCard";
import { GetClinicsV2 } from "@/actions/clinics/clinic.action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClinicItem = NonNullable<GetClinicsV2["data"]>[number];

type SortOption = "name-asc" | "name-desc" | "members-desc" | "members-asc";

const SORT_LABELS: Record<SortOption, string> = {
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
  "members-desc": "Most staff",
  "members-asc": "Fewest staff",
};

interface Props {
  data: GetClinicsV2;
}

export default function ClinicListShell({ data }: Props) {
  const [sort, setSort] = useState<SortOption>("name-asc");

  const processed = useMemo(() => {
    const items: ClinicItem[] = [...(data.data ?? [])];
    items.sort((a, b) => {
      switch (sort) {
        case "name-asc":     return a.name.localeCompare(b.name);
        case "name-desc":    return b.name.localeCompare(a.name);
        case "members-desc": return b.memberCount - a.memberCount;
        case "members-asc":  return a.memberCount - b.memberCount;
      }
    });
    return items;
  }, [data, sort]);

  const sortSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="flex items-center gap-2 bg-transparent">
          <ArrowUpDown className="h-4 w-4" />
          {sort === "name-asc" ? "Sort" : SORT_LABELS[sort]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <DropdownMenuItem key={key} onClick={() => setSort(key)} className="gap-2">
              <Check className={`h-3.5 w-3.5 ${sort === key ? "opacity-100" : "opacity-0"}`} />
              {SORT_LABELS[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <SearchPaginatedList<ClinicItem>
      data={processed}
      searchBy={(item, term) =>
        item.name.toLowerCase().includes(term) ||
        (item.description ? item.description.toLowerCase().includes(term) : false)
      }
      sortSlot={sortSlot}
      render={(item) => <ClinicCard {...(item as React.ComponentProps<typeof ClinicCard>)} />}
    />
  );
}
