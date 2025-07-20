"use client";

import SearchPaginatedList from "../SearchPaginatedList";
import HPTypeCard from "./HPTypeCard";
import { GetHPTypeCountsType } from "@/actions/hp.actions";

interface Props {
  data: GetHPTypeCountsType;
}

export default function HPTypeListShell({ data }: Props) {
  return (
    <SearchPaginatedList
      data={data}
      searchBy={(item, term) =>
        item.name.toLowerCase().includes(term) ||
        (item.description?.toLowerCase() ?? "").includes(term)
      }
      render={(item) => <HPTypeCard {...item} />}
    />
  );
}
