"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Check, Filter } from "lucide-react";
import { GetOrganizationsV2 } from "@/actions/organizations/organization.action";
import SearchPaginatedList from "../SearchPaginatedList";
import OrganizationCard from "./OrganizationCard";
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

type OrgListItem = GetOrganizationsV2[number];

type SortOption = "name-asc" | "name-desc" | "members-desc" | "members-asc";
type FilterOption = "all" | "member" | "not-member";

const SORT_LABELS: Record<SortOption, string> = {
  "name-asc": "Name: A → Z",
  "name-desc": "Name: Z → A",
  "members-desc": "Most members",
  "members-asc": "Fewest members",
};

const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All organizations",
  member: "I'm a member",
  "not-member": "Not yet joined",
};

interface Props {
  data: GetOrganizationsV2;
  membershipStatusMap?: Record<string, string>;
}

export default function OrganizationListShell({ data, membershipStatusMap = {} }: Props) {
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [filter, setFilter] = useState<FilterOption>("all");

  const processed = useMemo(() => {
    let result = [...data];

    // Filter
    if (filter === "member") {
      result = result.filter((item) => !!membershipStatusMap[item.orgUid]);
    } else if (filter === "not-member") {
      result = result.filter((item) => !membershipStatusMap[item.orgUid]);
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "name-asc":  return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "members-desc": return b.memberCount - a.memberCount;
        case "members-asc":  return a.memberCount - b.memberCount;
      }
    });

    return result;
  }, [data, sort, filter, membershipStatusMap]);

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

  const filterSlot = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="flex items-center gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          {filter === "all" ? "Filter" : FILTER_LABELS[filter]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {(Object.keys(FILTER_LABELS) as FilterOption[]).map((key) => (
            <DropdownMenuItem key={key} onClick={() => setFilter(key)} className="gap-2">
              <Check className={`h-3.5 w-3.5 ${filter === key ? "opacity-100" : "opacity-0"}`} />
              {FILTER_LABELS[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <SearchPaginatedList<OrgListItem>
      data={processed}
      searchBy={(item, term) =>
        item.name.toLowerCase().includes(term) ||
        (item.description ? item.description.toLowerCase().includes(term) : false)
      }
      sortSlot={sortSlot}
      filterSlot={filterSlot}
      render={(item) => (
        <OrganizationCard
          {...item}
          membershipStatus={membershipStatusMap[item.orgUid] ?? null}
        />
      )}
    />
  );
}
