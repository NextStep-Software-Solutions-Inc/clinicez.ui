import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import React from "react";
import { z } from "zod";
import { Severity } from "@prisma/client";
import { format } from "date-fns";
import DeleteIllnessButton from "./DeleteIllnessButton";
import EditIllnessForm from "./EditIllnessForm";

export const illnessSchema = z.object({
  id: z.number(),
  illness: z.string({
    required_error: "Illness is required.",
    message: "Please select a illness.",
  }).refine(value => value.trim().length > 0, {
    message: "Illness is required.",
  }),
  dateDiagnosed: z.date({
    message: "Invalid date."
  }).optional(),
  severity: z.nativeEnum(Severity, {
    required_error: "Severity is required.",
    message: "Please select a severity level.",
  }),
  notes: z.string().optional(),
})

export type Illness = z.infer<typeof illnessSchema>;

interface IllnessItemProps {
  readOnly?: boolean;
  illness: Illness;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: Illness) => void;
}
  
export default function IllnessItem({illness, index, remove, update, readOnly = true}: IllnessItemProps){
  
  const [isEditing, setIsEditing] = React.useState(false);
  const handleOnUpdate = (index: number, value: Illness) => {
    update(index, value);
    setIsEditing(false);
  }
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!illness.illness}>
        <Card className="group/actions">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{illness.illness}</span>
              <ConditionalRender condition={!readOnly}>
                <span className="ml-auto flex space-x-2 invisible group-hover/actions:visible transition-all">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                  <DeleteIllnessButton illnessId={illness.id} remove={remove} index={index}/>
                </span>
              </ConditionalRender>
            </CardTitle>
            <Separator/>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {illness.dateDiagnosed && <div>Date Diagnosed: {format(illness.dateDiagnosed, "PP")}</div>}
              <div className="capitalize">Severity: {illness.severity.toLowerCase()}</div>
              <ConditionalRender condition={!!illness.notes}>
                <div>Notes: {illness.notes}</div>
              </ConditionalRender>
            </div>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing || !illness.illness}>
        <EditIllnessForm
          index={index}
          remove={remove}
          onUpdate={handleOnUpdate}
          illness={illness}
        />
      </ConditionalRender>
    </>
  )
}

