"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import React from "react";
import { format } from "date-fns";
import DeleteIllnessButton from "./DeleteIllnessButton";
import EditIllnessForm from "./EditIllnessForm";
import { Illness } from "./IllnessList";
import { Badge } from "@components/ui/badge";
import { toast } from "sonner";
import { setUserIllnessStatusAction } from "@actions/user-illness.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Check } from "lucide-react";


interface IllnessItemProps {
  readOnly?: boolean;
  illness: Illness;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: Illness) => void;
}
  
export default function IllnessItem({illness, index, remove, update, readOnly = true}: IllnessItemProps){
  
  const user = useUser()
  const userId = user.user?.sub
  const [isEditing, setIsEditing] = React.useState(false);
  const handleOnUpdate = (index: number, value: Illness) => {
    update(index, value);
    setIsEditing(false);
  }

  const handleSetAsResolved = () => {
    if(!userId) {
      toast.error("You are not authorized to perform this action")
      return
    }
    const status = "RESOLVED"
    toast.promise(setUserIllnessStatusAction(illness.id, status, userId), {
      loading: "Setting as resolved...",
      success: (res) => {
        if(res.status) {
          update(index, {...illness, status})
        }
        return res.message;
      },
      error: (error) => `Failed to set as resolved Error: ${error.message}`
    })
  }
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!illness.HealthCondition.name}>
        <Card className="group/actions">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{illness.HealthCondition.name}</span>
              <Badge variant="destructive" className="ml-2">{illness.severity}</Badge>
              <ConditionalRender condition={!!illness.status}>
                <Badge variant="secondary" className="ml-2">{illness.status}</Badge>
              </ConditionalRender>
              <span className="ml-auto flex space-x-2 invisible group-hover/actions:visible transition-all">
                <ConditionalRender condition={!readOnly && illness.status !== "RESOLVED"}>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                  <DeleteIllnessButton illnessId={illness.id} remove={remove} index={index}/>
                </ConditionalRender>
                <ConditionalRender condition={illness.status !== "RESOLVED"}>
                  <Button size="sm" onClick={() => handleSetAsResolved()}><Check className="mr-1 w-4 h-4"/> Set as Resolved</Button>
                </ConditionalRender>
              </span>
            </CardTitle>
            <Separator/>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {illness.dateDiagnosed && <div>Date Diagnosed: {format(illness.dateDiagnosed, "PP")}</div>}
              {illness.dateResolved && <div>Date Resolved: {format(illness.dateResolved, "PP")}</div>}
              {illness.dateResolved && <div>Resolved by: {illness.ResolvedBy?.firstName} {illness.ResolvedBy?.lastName}</div>}
              <div>Notes: {illness.notes}</div>
            </div>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing || !illness.HealthCondition.name}>
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

