"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";

import IllnessItem from "./IllnessItem";
import { Badge } from "@components/ui/badge";
import { Plus } from "lucide-react";
import { Severity } from "@prisma/client";
import ConditionalRender from "@components/utils/ConditionalRender";
import { Illness } from "./IllnessList";

export interface IllnessesFormProps {
  readOnly?: boolean
  illnesses: Illness[]
}

export default function IllnessesForm({illnesses, readOnly = true}:IllnessesFormProps) {
  const form = useForm<{illnesses: Illness[]}>({
    defaultValues: {
      illnesses: illnesses
    }
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "illnesses",
    keyName: "fieldId"
  })

  const illnessInitialValues: Illness = {
    id: 0,
    HealthCondition: {
      name: ""
    },
    severity: Severity.MILD,
    status: null,
    notes: null,
    dateDiagnosed: null,
    dateResolved: null,
    DiagnosedBy: null,
    ResolvedBy: null,
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Illnesses <Badge variant="destructive" className="ml-2">{fields.length}</Badge>
          <ConditionalRender condition={!readOnly}>
            <Button className="ml-auto" onClick={() => append(illnessInitialValues)}>Add Illness</Button>
          </ConditionalRender>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion type="multiple" className="w-full space-y-5">
          <AccordionItem value="illnesses">
            <AccordionTrigger>
              <div>
                List of illnesses <span className="italic font-light">(click to expand)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-5 flex flex-wrap gap-2">
              <Each
                of={fields}
                render={(illness, index) => <IllnessItem readOnly={readOnly} illness={illness} index={index} remove={remove} update={update}/>}
              />
              <ConditionalRender condition={!readOnly}>
                <Button variant="ghost" className="w-full" onClick={() => append(illnessInitialValues)}><Plus className="mr-2 h-4 w-4"/>Add Illness</Button>
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
