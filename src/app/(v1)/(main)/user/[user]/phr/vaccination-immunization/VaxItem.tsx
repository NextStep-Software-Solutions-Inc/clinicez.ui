import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import React from "react";
import { UserVaccinationType } from "./Vaccinations";
import { format } from "date-fns";
import UpdateUserVaccinationModal from "./modal/UpdateUserVaccinationModal";
import { DeleteVaccinationForm } from "./DeleteVaccinationForm";
import ConditionalRender from "@components/utils/ConditionalRender";

interface VaxItemProps {
  vaccination: UserVaccinationType,
  readOnly?: boolean
}
export default function VaxItem({vaccination, readOnly = true}: VaxItemProps){

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap gap-2 items-center group/actions">
          <span>{vaccination.Vaccine.type}</span>
          <ConditionalRender condition={!readOnly}>
            <span className="ml-auto flex-grow sm:flex-grow-0 flex flex-wrap gap-2 invisible group-hover/actions:visible transition-all">
              <UpdateUserVaccinationModal vaccination={vaccination} />
              <DeleteVaccinationForm vaccinationId={vaccination.id}/>
            </span>
          </ConditionalRender>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 text-sm">
          <div>
            <div className="font-bold">{vaccination.Vaccine.name}</div>
            <div>Vaccine</div>
          </div>
          <div>
            <div className="font-bold">{format(vaccination.dateGiven, "PP")}</div>
            <div>Date received</div>
          </div>
          <div>
            <div className="font-bold">{vaccination.Route.route}</div>
            <div>Route</div>
          </div>
          <div>
            <div className="font-bold">{vaccination.Dose.dose}</div>
            <div>Dose</div>
          </div>
          <div>
            <div className="font-bold">{vaccination.administeredBy}</div>
            <div>Administered By</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}