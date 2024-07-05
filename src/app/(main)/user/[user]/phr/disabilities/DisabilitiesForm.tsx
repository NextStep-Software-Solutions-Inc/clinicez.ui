"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import DisabilityItem, { disabilitySchema } from "./DisabilityItem";
import { Badge } from "@components/ui/badge";
import { Plus } from "lucide-react";
import { Severity } from "@prisma/client";
import ConditionalRender from "@components/utils/ConditionalRender";

const disabilitiesSchema = z.object({
  disabilities: z.array(disabilitySchema)
})

export interface DisabilitiesFormProps {
  readOnly?: boolean,
  disabilities: {
    id: number,
    disability: string,
    notes?: string,
    severity: Severity
    dateDiagnosed?: Date,
  }[]
}

export default function DisabilitiesForm({disabilities, readOnly = true}:DisabilitiesFormProps) {
  const form = useForm<z.infer<typeof disabilitiesSchema>>({
    resolver: zodResolver(disabilitiesSchema),
    defaultValues: {
      disabilities: disabilities
    }
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "disabilities",
    keyName: "fieldId"
  })

  const disabilityInitialValues = {
    id: 0,
    disability: "",
    severity: Severity.MILD,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Disabilities <Badge className="ml-2">{fields.length}</Badge>
          <ConditionalRender condition={!readOnly}>
            <Button className="ml-auto" onClick={() => append(disabilityInitialValues)}>Add Disability</Button>
          </ConditionalRender>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion type="multiple" className="w-full space-y-5">
          <AccordionItem value="disabilities">
            <AccordionTrigger>List of disabilities</AccordionTrigger>
            <AccordionContent className="p-5 space-y-2">
              <Each
                of={fields}
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
