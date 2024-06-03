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
import ActionButton from "@components/ActionButton";
import { toast } from "@components/ui/use-toast";

const disabilitiesSchema = z.object({
  disabilities: z.array(disabilitySchema)
})

const disabilities = [
  {
    type: "Blind",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Deaf",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Mute",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Paralyzed",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Amputee",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Cognitive Disability",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Physical Disability",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Developmental Disability",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  },
  {
    type: "Learning Disability",
    dateDiagnosed: new Date(),
    severity: "Severe",
    notes: "Notes",
  }
]

export default function DisabilitiesForm() {
  const form = useForm<z.infer<typeof disabilitiesSchema>>({
    resolver: zodResolver(disabilitiesSchema),
    defaultValues: {
      disabilities: disabilities
    }
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "disabilities"
  })

  const disabilityInitialValues = {
    type: "",
    dateDiagnosed: new Date,
    severity: "",
    notes: "",
  }

  const action = async (formData: FormData) => {
    console.log("sdklkk");
    
    form.handleSubmit((data) => {
      toast({
        title: "Disabilities Updated",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        )
      })
    })()
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            Disabilities
          <Button className="ml-auto" onClick={() => append(disabilityInitialValues)}>Add Disability</Button>
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
                render={(disability, index) => <DisabilityItem disability={disability} index={index} remove={remove} update={update}/>}
              />
              <Button className="w-full" onClick={() => append(disabilityInitialValues)}>Add Disability</Button>

            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter>
        <ActionButton onClick={form.handleSubmit((data) => {
          console.log(data)
        })} disabled={form.formState.isLoading}>Save</ActionButton>
      </CardFooter>
    </Card>
  );
}
