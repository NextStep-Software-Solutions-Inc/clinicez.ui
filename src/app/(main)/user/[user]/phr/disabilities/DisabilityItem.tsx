import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import React from "react";
import { z } from "zod";
import { Severity } from "@prisma/client";
import { format } from "date-fns";
import DeleteDisabilityButton from "./DeleteDisabilityButton";
import EditDisabilityForm from "./EditDisabilityForm";

export const disabilitySchema = z.object({
  id: z.number(),
  disability: z.string({
    required_error: "Disability is required.",
    message: "Please select a disability.",
  }).refine(value => value.trim().length > 0, {
    message: "Disability is required.",
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

export type Disability = z.infer<typeof disabilitySchema>;

interface DisabilityItemProps {
  readOnly?: boolean;
  disability: Disability;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: Disability) => void;
}
  
export default function DisabilityItem({disability, index, remove, update, readOnly = true}: DisabilityItemProps){
  
  const [isEditing, setIsEditing] = React.useState(false);
  const handleOnUpdate = (index: number, value: Disability) => {
    update(index, value);
    setIsEditing(false);
  }
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!disability.disability}>
        <Card className="group/actions">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{disability.disability}</span>
              <ConditionalRender condition={!readOnly}>
                <span className="ml-auto flex space-x-2 invisible group-hover/actions:visible transition-all">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                  <DeleteDisabilityButton disabilityId={disability.id} remove={remove} index={index}/>
                </span>
              </ConditionalRender>
            </CardTitle>
            <Separator/>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {disability.dateDiagnosed && <div>Date Diagnosed: {format(disability.dateDiagnosed, "PP")}</div>}
              <div className="capitalize">Severity: {disability.severity.toLowerCase()}</div>
              <ConditionalRender condition={!!disability.notes}>
                <div>Notes: {disability.notes}</div>
              </ConditionalRender>
            </div>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing || !disability.disability}>
        <EditDisabilityForm
          index={index}
          remove={remove}
          onUpdate={handleOnUpdate}
          disability={disability}
        />
      </ConditionalRender>
    </>
  )
}

