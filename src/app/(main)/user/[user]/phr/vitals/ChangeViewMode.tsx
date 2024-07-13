"use client";

import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ChangeViewMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view_mode") || "tile";

  const handleChangeTab = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("view_mode", value);
    router.replace(`${pathname}?${newSearchParams.toString()}`);
  }
  return (
    <Tabs className="flex-grow" defaultValue={viewMode} onValueChange={handleChangeTab} >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="tile">Tile Mode</TabsTrigger>
        <TabsTrigger value="chart">Chart Mode</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
