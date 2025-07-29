"use client";

import SearchPaginatedList from "../SearchPaginatedList";
import ClinicCard from "./ClinicCard";
import { GetClinicsV2 } from "@/actions/clinics/clinic.action";

interface Props {
  data: GetClinicsV2;
}

export default function ClinicListShell({ data }: Props) {
  return (
    <SearchPaginatedList
      data={data.data ?? []}
      searchBy={(item, term) =>
        item.name.toLowerCase().includes(term) ||
        (item.description ? item.description.toLowerCase().includes(term) : false)
      }
      render={(item) => <ClinicCard {...(item as React.ComponentProps<typeof ClinicCard>)} />}
    />
  );
}
