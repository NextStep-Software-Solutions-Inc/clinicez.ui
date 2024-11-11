"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { useFieldArray, useForm } from "react-hook-form";
import DisabilityItem  from "./DisabilityItem";
import { Badge } from "@components/ui/badge";
import { Plus } from "lucide-react";
import { Severity } from "@prisma/common/client";
import ConditionalRender from "@components/utils/ConditionalRender";
import { Disability } from "./DisabilityList";

export interface DisabilitiesFormProps {
  readOnly?: boolean,
  disabilities: Disability[]
}

export default function DisabilitiesForm({disabilities, readOnly = true}:DisabilitiesFormProps) {
  const form = useForm<{disabilities: Disability[]}>({
    defaultValues: {
      disabilities: disabilities
    }
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "disabilities",
    keyName: "fieldId"
  })

  const disabilityInitialValues: Disability = {
    id: 0,
    Disability: {
      name: ""
    },
    severity: Severity.MILD,
    dateDiagnosed: null,
    notes: null,
    isManaged: false 
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap gap-2 items-center">
            Disabilities <Badge variant="destructive" className="ml-2">{fields.length}</Badge>
          <ConditionalRender condition={!readOnly}>
            <Button className="ml-auto flex-grow sm:flex-grow-0" onClick={() => append(disabilityInitialValues)}>Add Disability</Button>
          </ConditionalRender>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion type="multiple" className="w-full space-y-5">
          <AccordionItem value="disabilities">
            <AccordionTrigger>
              <div>
                List of disabilities <span className="italic font-light">(click to expand)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-5 flex flex-wrap gap-2">
              <Each
                of={fields}
                fallback={<div className="text-muted-foreground text-center w-full">No declared disabilities.</div>}
                render={(disability, index) => <DisabilityItem readOnly={readOnly} disability={disability} index={index} remove={remove} update={update}/>}
              />
              <ConditionalRender condition={!readOnly}>
                <Button variant="ghost" className="w-full" onClick={() => append(disabilityInitialValues)}><Plus className="mr-2 h-4 w-4"/>Add Disability</Button>
              </ConditionalRender>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
}
