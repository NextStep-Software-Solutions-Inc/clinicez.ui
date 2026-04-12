"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import SearchPaginatedList from "../SearchPaginatedList";
import HPTypeCard from "./HPTypeCard";
import { GetHPTypeCountsType } from "@/actions/hp.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type SortOption = "count-desc" | "count-asc" | "name-asc" | "name-desc";

const SORT_LABELS: Record<SortOption, string> = {
  "count-desc": "Most Available",
  "count-asc": "Least Available",
  "name-asc": "Name A–Z",
  "name-desc": "Name Z–A",
};

interface Props {
  data: GetHPTypeCountsType;
}

export default function HPTypeListShell({ data }: Props) {
  const [sort, setSort] = useState<SortOption>("count-desc");

  const sortedData = useMemo(() => {
    const copy = [...data];
    switch (sort) {
      case "count-asc":
        return copy.sort((a, b) => a.count - b.count);
      case "name-asc":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return copy.sort((a, b) => b.name.localeCompare(a.name));
      case "count-desc":
      default:
        return copy.sort((a, b) => b.count - a.count);
    }
  }, [data, sort]);

  const sortSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="flex items-center gap-2 bg-transparent">
          <ArrowUpDown className="h-4 w-4" />
          {SORT_LABELS[sort]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => setSort(option)}
            className={sort === option ? "font-semibold" : ""}
          >
            {SORT_LABELS[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <SearchPaginatedList
      data={sortedData}
      searchBy={(item, term) =>
        item.name.toLowerCase().includes(term) ||
        (item.description?.toLowerCase() ?? "").includes(term)
      }
      render={(item) => <HPTypeCard {...item} />}
      sortSlot={sortSlot}
    />
  );
}
