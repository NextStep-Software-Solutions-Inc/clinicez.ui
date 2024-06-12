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
import { Plus } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import AllergyItem, { allergySchema } from "./AllergyItem";

const allergies = [
  {
    id: faker.number.int(),
    allergen: "Peanuts",
    reaction: "Slightly sneezy and a little bit of itching",
  },
  {
    id: faker.number.int(),
    allergen: "Shellfish",
    reaction: "Itchy and sneezing all over my body",
  },
  {
    id: faker.number.int(),
    allergen: "Mold",
    reaction: "Itchy and sneezing all over my body",
  },
  {
    id: faker.number.int(),
    allergen: "Peanuts",
    reaction: "Slightly sneezy and a little bit of itching",
  }
]


const allergiesSchema = z.object({
  allergies: z.array(allergySchema)
});

export default function AllergiesForm() {

  const initialAllergyValues = {
    id: faker.number.int(),
    allergen: "",
    reaction: "",
  }

  const {formState, ...form} = useForm({
    resolver: zodResolver(allergiesSchema),
    defaultValues: {
      allergies: allergies,
    },
  });

  const { fields, remove, update, append } = useFieldArray({
    control: form.control,
    name: "allergies",
    keyName: "fieldId",
  });

  const handleSaveChanges = async () => {
    await delay(1000);
    await form.handleSubmit(data => {
      form.reset(data);
      toast({
        title: "Allergies updated",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        )
      })
    })();
  }

  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="insurance">
        <AccordionTrigger>List of Allergies</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <Each
            of={fields}
            render={(allergy, index) => <AllergyItem index={index} allergy={allergy} remove={remove} update={update} />}
          />
          <Button variant="ghost" className="w-full" onClick={() => append(initialAllergyValues)}><Plus className="mr-2 h-4 w-4"/>Add Known Allergy</Button>
          <form action={handleSaveChanges}>
            {formState.isDirty && <ActionButton disabled={formState.isLoading || !formState.isValid}>Save Changes</ActionButton>}
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
