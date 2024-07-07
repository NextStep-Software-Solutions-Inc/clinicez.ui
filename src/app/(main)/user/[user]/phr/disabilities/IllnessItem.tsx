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
      <ConditionalRender condition={!isEditing && !!illness.HealthCondition.name}>
        <Card className="group/actions">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>{illness.HealthCondition.name}</span>
              <Badge variant="destructive" className="ml-2">{illness.severity}</Badge>
              <Badge variant="secondary" className="ml-2">{illness.status}</Badge>
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

