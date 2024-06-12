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


const insurancesSchema = z.object({
  insurances: z.array(insuranceSchema)
})

type Insurances = z.infer<typeof insurancesSchema>;

const insurances = [
  {
    provider: "Pru Life UK",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Sun Life",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Manulife",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "AXA",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "Philam Life",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "BPI-Philam",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  },
  {
    provider: "BDO Life",
    policyNumber: "123456789",
    policyType: "Life",
    dateStarted: new Date(),
    dateEnded: new Date(),
    notes: "Notes",
  }
]

const initialInsuranceValues = {
  provider: "",
  policyNumber: "",
  policyType: "",
  dateStarted: new Date(),
  dateEnded: new Date(),
  notes: "",
}

export default function InsurancesForm() {
  const {formState, ...form} = useForm<Insurances>({
    resolver: zodResolver(insurancesSchema),
    defaultValues: {
      insurances
    }
  })

  const {fields,append, remove, update} = useFieldArray({
    control: form.control,
    name: "insurances"
  })

  const handleSaveChanges = async () => {
    await delay(1000);
    form.handleSubmit((data) => {
      form.reset(data);
      toast({
        title: "Insurances Updated",
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
      <AccordionItem value="insurance">
        <AccordionTrigger>My Insurance Provider</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={fields}
            render={(insurance, index) => <InsuranceItem  index={index} insurance={insurance} remove={remove} update={update} /> }
          />
          <Button variant="ghost" className="w-full" onClick={() => append(initialInsuranceValues)}><Plus className="mr-2 h-4 w-4"/>Add Insurance Provider</Button>
          <form action={handleSaveChanges}>
            {formState.isDirty && <ActionButton disabled={formState.isLoading || !formState.isValid}>Save Changes</ActionButton>}
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
