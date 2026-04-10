"use client";

import { GetOrganizationsV2 } from "@/actions/organizations/organization.action";
import SearchPaginatedList from "../SearchPaginatedList";
import OrganizationCard from "./OrganizationCard";

interface Props {
  data: GetOrganizationsV2;
  membershipStatusMap?: Record<string, string>;
}

export default function OrganizationListShell({ data, membershipStatusMap = {} }: Props) {
  return (
    <SearchPaginatedList
      data={data}
      searchBy={(item, term) =>
        item.name.toLowerCase().includes(term) ||
        (item.description ? item.description.toLowerCase().includes(term) : false)
      }
      render={(item) => (
        <OrganizationCard
          {...item}
          membershipStatus={membershipStatusMap[item.orgUid] ?? null}
        />
      )}
    />
  );
}
