"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import Each from "@components/utils/Each";
import { z } from "zod";
import InsuranceItem, { insuranceSchema } from "./InsuranceItem";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import ActionButton from "@components/ActionButton";
import { delay } from "@lib/wait";
import { toast } from "@components/ui/use-toast";
import HMOItem from "./HMOItem";


const hmosSchema = z.object({
  hmos: z.array(insuranceSchema)
})

type HMOS = z.infer<typeof hmosSchema>;


const hmos = [
  {
    provider: "Maxicare",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Medicard",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Intellicare",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "ValuCare",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Cocolife Health",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "AsianLife Health",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Generali Pilipinas",
    policyNumber: "123456789",
    policyType: "Health",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  }
]

const initialHMOValues = {
  provider: "",
  policyNumber: "",
  policyType: "",
  dateStarted: new Date(),
  dateEnded: new Date(),
  notes: "",
}

export default function HMOsForm() {
  const {formState, ...form} = useForm<HMOS>({
    resolver: zodResolver(hmosSchema),
    defaultValues: {
      hmos
    }
  })

  const {fields,append, remove, update} = useFieldArray({
    control: form.control,
    name: "hmos"
  })

  const handleSaveChanges = async () => {
    await delay(1000);
    form.handleSubmit((data) => {
      form.reset(data);
      toast({
        title: "HMOs Updated",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        )
      });
    })()
  }
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="hmos">
        <AccordionTrigger>My HMO Provider</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={fields}
            render={(hmo, index) => <HMOItem  index={index} hmo={hmo} remove={remove} update={update} /> }
          />
          <Button variant="ghost" className="w-full" onClick={() => append(initialHMOValues)}><Plus className="mr-2 h-4 w-4"/>Add HMO Provider</Button>
          <form action={handleSaveChanges}>
            {formState.isDirty && <ActionButton disabled={formState.isLoading || !formState.isValid}>Save Changes</ActionButton>}
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
