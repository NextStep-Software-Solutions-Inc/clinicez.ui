"use client";

import { deleteAppointmentTypeAction, GetAppointmentTypes } from "@actions/appointments/appointment-type.action";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { useOrgAppointmentTypes } from "@/hooks/useClinicAppointmentCategory";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import AddAppointmentTypeModal from "./modal/AddAppointmentTypeModal";
import UpdateAppointmentTypeModal from "./modal/UpdateAppointmentTypeModal";

export default function AppointmentTypeList() {
  const params = useParams<{clinicUid: string}>()
  const {data: appointmentTypes, isLoading, mutate} = useOrgAppointmentTypes(params.clinicUid)

  const deleteAppointmentType = (id: number) => {
    toast.promise(deleteAppointmentTypeAction(id), {
      loading: "Deleting appointment type...",
      success: res => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to delete appointment type"
    })
  }

  if(isLoading) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Appointment Types 
          </span>
          <AddAppointmentTypeModal clinicUid={params.clinicUid} onAddAppointmentType={mutate}/>
        </CardTitle>
        <CardDescription>
          Appointment types are used to categorize appointments. You can create, edit, and delete appointment types here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Each
            of={appointmentTypes ?? []}
            render={(appointmentType) => {
              return (
                <ListItem 
                  key={appointmentType.id}
                  name={`${appointmentType.name} - ${appointmentType.AppointmentTypeAttribute?.duration} minutes duration, ${appointmentType.AppointmentTypeAttribute?.durationPadding} minutes padding/buffer`}
                  description={appointmentType.description}
                  actions={<Actions
                    appointmentType={appointmentType}
                    deleteAction={() => {
                      deleteAppointmentType(appointmentType.id)
                    }}
                    editAction={mutate}
                  />}
                />
              )
            }}
          />
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}


interface ListItemProps {
  name: string;
  description?: string | null;
  actions?: React.ReactNode;
}
export const ListItem = ({name,actions, description}: ListItemProps) => {
  return (
    <div className="flex items-center justify-between gap-2 hover:bg-slate-50 py-1 px-2 rounded-md">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground text-sm">{description ?? "No description"}</div>
      </div>
      <div>
        {actions}
      </div>
    </div>
  )
}

interface ActionsProps {
  appointmentType: GetAppointmentTypes[number];
  editAction?: () => void;
  deleteAction?: () => void;
}
export const Actions = ({deleteAction, editAction, appointmentType}: ActionsProps) => {
  return (
    <div className="flex gap-1">
      <UpdateAppointmentTypeModal
        appointmentType={appointmentType}
        onAddAppointmentType={editAction}
      />
      <Button onClick={deleteAction} variant="ghost" size="icon" >
        <Trash size={16} className="text-destructive"/>
      </Button>
    </div>
  )
}