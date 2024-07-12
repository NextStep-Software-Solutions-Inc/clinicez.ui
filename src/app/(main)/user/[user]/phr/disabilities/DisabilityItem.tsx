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
        <Card className="group/actions basis-64 flex-grow">
          <CardHeader>
            <CardTitle className="flex flex-wrap gap-2 items-center">
              <div className="flex-grow sm:flex-grow-0 flex gap-2 items-center">
                <span>{disability.Disability.name}</span>
                <ConditionalRender condition={!disability.isManaged}>
                  <Badge variant="secondary" className="w-full sm:w-auto">Managed</Badge>
                </ConditionalRender>
              </div>
              <ConditionalRender condition={!readOnly}>
                <span className="ml-auto flex-grow md:flex-grow-0 flex space-x-2 invisible group-hover/actions:visible transition-all">
                  <Button className="w-full" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
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

