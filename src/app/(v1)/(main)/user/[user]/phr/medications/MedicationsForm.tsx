"use client";

import ActionButton from "@components/ActionButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { toast } from "@components/ui/use-toast";
import Each from "@components/utils/Each";
import { faker } from "@faker-js/faker";
import { zodResolver } from "@hookform/resolvers/zod";
import { delay } from "@lib/wait";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import MedicationItem, { medicationSchema } from "./MedicationItem";

const medicationsSchema = z.object({
  medications: z.array(medicationSchema)
})

type Medications = z.infer<typeof medicationsSchema>

const medications = [
  {
    id: faker.number.int(),
    name: "Ibuprofen",
    reason: "Headache",
    dateStarted: faker.date.recent(),
    dateResolved: faker.date.recent(),
  },
  {
    id: faker.number.int(),
    name: "Lopinavir",
    reason: "Hyperventilation", 
    dateStarted: faker.date.recent(),
    dateResolved: faker.date.recent(),
  }, 
  {
    id: faker.number.int(),
    name: "Lozaratan",
    reason: "High blood pressure",
    dateStarted: faker.date.recent(),
    dateResolved: faker.date.recent(),
  }
]

export default function MedicationsForm() {

  const initialMedicationValues = {
    id: faker.number.int(),
    name: "",
    reason: "",
    dateStarted: new Date(),
    dateResolved: new Date(),
  }

  const {formState, ...form} = useForm<Medications>({
    resolver: zodResolver(medicationsSchema),
    defaultValues: {
      medications: medications,
    },
  });

  const {fields, append, remove, update} = useFieldArray({
    control: form.control,
    name: "medications",
    keyName: "fieldId",
  })

  const handleSaveChanges  = async () => {
    await delay(1000);
    form.handleSubmit((data) => {
      form.reset(data);
      toast({
        title: "Medications Saved",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        )
      });
    })();
  }

  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="insurance">
        <AccordionTrigger>List of Medications</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={fields}
            render={(medication, index) => <MedicationItem index={index} medication={medication} remove={remove} update={update}/>}
          />
          <Button variant="ghost" className="w-full" onClick={() => append(initialMedicationValues)}><Plus className="mr-2 h-4 w-4"/>Add your Medication</Button>
          <form action={handleSaveChanges}>
            {formState.isDirty && <ActionButton disabled={formState.isLoading || !formState.isValid}>Save Changes</ActionButton>}
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
