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
import IllnessItem from "./IllnessItem";

const illnessSchema = z.object({
  type: z.string().min(2, {
    message: "Type must be at least 2 characters.",
  }).max(30, {
    message: "Type must not be longer than 30 characters.",
  }),
  dateDiagnosed: z.date({
    required_error: "Please select a date.",
  }),
  severity: z.string().min(2, {
    message: "Severity must be at least 2 characters.",
  }).max(30, {
    message: "Severity must not be longer than 30 characters.",
  }),
  notes: z.string().optional(),
})

const illnessesSchema = z.object({
  illnesses: z.array(illnessSchema)
})

const illnesses = [
  {
    type: "COVID-19",
    dateDiagnosed: new Date,
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Pneumonia",
    dateDiagnosed: new Date,
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Asthma",
    dateDiagnosed: new Date,
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Diabetes",
    dateDiagnosed: new Date,
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Hypertension",
    dateDiagnosed: new Date,
    severity: "Severe",
    notes: "Notes",
  }

]

export default function IllnessesForm() {
  const form = useForm<z.infer<typeof illnessesSchema>>({
    resolver: zodResolver(illnessesSchema),
    defaultValues: {
      illnesses: illnesses
    }
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "illnesses"
  })


  const illnessInitialValues = {
    type: "",
    dateDiagnosed: new Date,
    severity: "",
    notes: "",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Illness
          <Button className="ml-auto" onClick={() => append(illnessInitialValues)}>Add Illness</Button>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent  >
        <Accordion type="multiple" className=" space-y-5">
          <AccordionItem value="illness">
            <AccordionTrigger>List of illness</AccordionTrigger>
            <AccordionContent className="p-5 space-y-2">
              <Each
                of={fields}
                render={(illness, index) => <IllnessItem key={index} index={index} illness={illness} remove={remove} update={update} />}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button className="w-full" onClick={() => append(illnessInitialValues)}>Add Illness</Button>

      </CardContent>
      <CardFooter>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  );
}
