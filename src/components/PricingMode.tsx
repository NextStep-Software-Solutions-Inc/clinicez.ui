"use client";

import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

export default function PricingMode({defaultMode ="monthly"}: {defaultMode: string}) {

  const router = useRouter();
  const handleChangeTab = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("freq", value);
    router.push(`?${params.toString()}`);
  }
  return (
    <Tabs defaultValue={defaultMode} onValueChange={handleChangeTab}>
      <TabsList className="rounded-lg">
        <TabsTrigger    
          value="monthly"
        >
            Monthly
        </TabsTrigger>
        <TabsTrigger
          value="yearly"
        >
            Yearly
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
