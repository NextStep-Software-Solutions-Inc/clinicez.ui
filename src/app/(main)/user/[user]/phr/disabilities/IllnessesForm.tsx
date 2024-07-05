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
import IllnessItem, { illnessSchema } from "./IllnessItem";
import { Badge } from "@components/ui/badge";
import { Plus } from "lucide-react";
import { Severity } from "@prisma/client";
import ConditionalRender from "@components/utils/ConditionalRender";

const illnessesSchema = z.object({
  illnesses: z.array(illnessSchema)
})

type Illnesses = z.infer<typeof illnessesSchema>;
export interface IllnessesFormProps {
  readOnly?: boolean
  illnesses: {
    id: number,
    illness: string,
    notes?: string,
    severity: Severity
    dateDiagnosed?: Date,
  }[]
}

export default function IllnessesForm({illnesses, readOnly = true}:IllnessesFormProps) {
  const form = useForm<Illnesses>({
    resolver: zodResolver(illnessesSchema),
    defaultValues: {
      illnesses: illnesses
    }
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "illnesses",
    keyName: "fieldId"
  })

  const illnessInitialValues = {
    id: 0,
    illness: "",
    severity: Severity.MILD,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Illnesses <Badge className="ml-2">{fields.length}</Badge>
          <ConditionalRender condition={!readOnly}>
            <Button className="ml-auto" onClick={() => append(illnessInitialValues)}>Add Illness</Button>
          </ConditionalRender>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion type="multiple" className="w-full space-y-5">
          <AccordionItem value="illnesses">
            <AccordionTrigger>List of illnesses</AccordionTrigger>
            <AccordionContent className="p-5 space-y-2">
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
