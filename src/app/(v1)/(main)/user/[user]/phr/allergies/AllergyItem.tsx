"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import { useState } from "react";
import { Allergy, EditAllergyForm } from "./EditAllergyForm";
import DeleteAllergyButton from "./DeleteAllergyButton";

interface AllergyItemProps {
  allergy: Allergy;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: Allergy) => void;
  readOnly?: boolean;
}

export default function AllergyItem({allergy, remove, update, index, readOnly}: AllergyItemProps) {

  const [isEditing, setIsEditing] = useState(allergy.allergen === "");

  const onUpdate = (index: number, value: Allergy) => {
    update(index, value);
    setIsEditing(false);
  }

  return (
    <>
      <ConditionalRender condition={!isEditing}>
        <Card className="group/actions flex-grow basis-52">
          <CardHeader>
            <CardTitle className="flex  gap-2 items-center">
              <span>{allergy.allergen}</span>
              <ConditionalRender condition={!readOnly}>
                <span className="ml-auto flex space-x-2 invisible group-hover/actions:visible transition-all">
                  <Button className="w-full" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                  <DeleteAllergyButton id={allergy.id} index={index} remove={remove}/>
                </span>
              </ConditionalRender>
            </CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            <section>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="font-semibold">Reaction</div>
                  <div>{allergy.reaction}</div>
                </div>
                <ConditionalRender condition={!!allergy.notes}>
                  <div>
                    <div className="font-semibold">Notes</div>
                    <div>{allergy.notes}</div>
                  </div>
                </ConditionalRender>
              </div>
            </section>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing}>
        <EditAllergyForm allergy={allergy} index={index} remove={remove} onUpdate={onUpdate}/>
      </ConditionalRender>
    </>
  );
}