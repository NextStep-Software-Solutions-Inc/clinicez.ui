"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { formatDate } from "date-fns";
import { Separator } from "@components/ui/separator";
import { Fragment, useState } from "react";
import VitalSign from "./VitalSign";
import Each from "@components/utils/Each";
import { GetUserVitalSigns } from "@actions/vitals.action";

interface MoreVitalsProps {
    vitalSigns: GetUserVitalSigns;
    readOnly: boolean
    
}
export default function MoreVitals({readOnly, vitalSigns}: MoreVitalsProps) {

  const [moreVitals, setMoreVitals] = useState(true);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="vitals">
        <AccordionTrigger onClick={() => setMoreVitals(moreVitals => !moreVitals)}>{moreVitals? "Show more vitals": "Hide Vitals"}</AccordionTrigger>
        <AccordionContent className="space-y-5 p-1">
          <Each
            of={vitalSigns}
            render={(vitalSign, index) => {
              return (
                <Fragment key={vitalSign.id}>
                  <h3 className="text-md font-medium">Date Taken: {formatDate(vitalSign.dateTaken, "PPp")}</h3>
                  <VitalSign readOnly={readOnly} vitalSign={vitalSign}/>
                  {vitalSigns.length - 1 !== index && <Separator/>}
                </Fragment>
              )
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}