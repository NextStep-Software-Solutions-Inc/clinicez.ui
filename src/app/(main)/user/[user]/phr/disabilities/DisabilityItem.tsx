import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import { format } from "date-fns";
import DeleteDisabilityButton from "./DeleteDisabilityButton";
import EditDisabilityForm from "./EditDisabilityForm";
import { Disability } from "./DisabilityList";
import { useState } from "react";
import { Badge } from "@components/ui/badge";

interface DisabilityItemProps {
  readOnly?: boolean;
  disability: Disability;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: Disability) => void;
}
  
export default function DisabilityItem({disability, index, remove, update, readOnly = true}: DisabilityItemProps){
  
  const [isEditing, setIsEditing] = useState(false);
  const handleOnUpdate = (index: number, value: Disability) => {
    update(index, value);
    setIsEditing(false);
  }
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!disability.Disability.name}>
        <Card className="group/actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{disability.Disability.name}</span>
              <ConditionalRender condition={!!disability.isManaged}>
                <Badge variant="secondary">Managed</Badge>
              </ConditionalRender>
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
      <ConditionalRender condition={isEditing || !disability.Disability.name}>
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

