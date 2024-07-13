"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { formatDate } from "date-fns";
import { Separator } from "@components/ui/separator";
import { useState } from "react";
import VitalSign from "./VitalSign";
import Each from "@components/utils/Each";
import { VitalSignsType } from "./RecentVitalSigns";

interface MoreVitalsProps {
    vitalSigns: VitalSignsType;
    readOnly: boolean
    
}
export default function MoreVitals({readOnly, vitalSigns}: MoreVitalsProps) {

  const [moreVitals, setMoreVitals] = useState(true);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="vitals">
        <AccordionTrigger onClick={() => setMoreVitals(moreVitals => !moreVitals)}>{moreVitals? "More Vitals": "Less Vitals"}</AccordionTrigger>
        <AccordionContent className="space-y-5 p-1">
          <Each
            of={vitalSigns}
            render={(vitalSign) => {
              return (
                <>
                  <h3 className="text-md font-medium">Date Taken: {formatDate(vitalSign.dateTaken, "PPp")}</h3>
                  <VitalSign readOnly={readOnly} vitalSign={vitalSign}/>
                  <Separator/>
                </>
              )
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}