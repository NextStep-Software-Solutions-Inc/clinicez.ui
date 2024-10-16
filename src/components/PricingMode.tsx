"use client";

import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useRouter } from "next/navigation";

export default function PricingMode({defaultMode ="MONTHLY"}: {defaultMode: string}) {

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
          value="MONTHLY"
        >
            Monthly
        </TabsTrigger>
        <TabsTrigger
          value="YEARLY"
        >
            Yearly
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
