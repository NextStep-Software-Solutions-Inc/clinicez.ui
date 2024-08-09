"use client";

import ActionButton from "@components/ActionButton";
import Each from "@components/utils/Each";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import AllergyItem from "./AllergyItem";
import { getUserAllergiesAction } from "@actions/users/user-allergy.action";
import { Plus } from "lucide-react";
import { allergySchema } from "./EditAllergyForm";
import ConditionalRender from "@components/utils/ConditionalRender";


const allergiesSchema = z.object({
  allergies: z.array(allergySchema)
});

type Allergies = z.infer<typeof allergiesSchema>;
interface AllergiesFormProps {
  allergies: Awaited<ReturnType<typeof getUserAllergiesAction>>
  readOnly?: boolean
}

const initialAllergy = {
  id: 0,
  allergen: "",
  reaction: "",
  notes: "",
}

export default function AllergiesForm({allergies, readOnly}:AllergiesFormProps) {

  const form = useForm<Allergies>({
    defaultValues: {
      allergies: [...allergies.map(allergy => ({
        ...allergy,
        allergen: allergy.Allergen.name
      }))]
    }
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "allergies",
    keyName: "fieldId"
  });

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Each
          of={fields}
          render={(allergy, index) => (
            <AllergyItem 
              readOnly={readOnly}
              key={allergy.id} 
              index={index} 
              allergy={allergy} 
              remove={remove}
              update={update}
            />)
          }
        />
     
      </div>
      <ConditionalRender  condition={!readOnly}>
        <ActionButton 
          onClick={() => append(initialAllergy)}
          variant="ghost" 
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4"/>Add Known Allergy
        </ActionButton>
      </ConditionalRender>
    </>
  );
}
