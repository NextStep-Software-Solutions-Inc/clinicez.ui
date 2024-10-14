"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { useOrgAppointmentModes } from "@hooks/useOrgAppointmentMode";
import { deleteAppointmentModeAction, GetAppointmentModes } from "@actions/appointments/appointment-mode.action";
import AddAppointmentModeModal from "./modal/AddAppointmentModeModal";
import UpdateAppointmentModeModal from "./modal/UpdateAppointmentModeModal";

export default function AppointmentModeList() {
  const params = useParams<{organization: string}>()
  const {data: appointmentModes, isLoading, mutate} = useOrgAppointmentModes(params.organization)

  const deleteAppointmentMode = (id: number) => {
    toast.promise(deleteAppointmentModeAction(id), {
      loading: "Deleting appointment mode...",
      success: res => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to delete appointment mode"
    })
  }

  if(isLoading) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Appointment Modes 
          </span>
          <AddAppointmentModeModal orgUid={params.organization} onAddAppointmentMode={mutate}/>
        </CardTitle>
        <CardDescription>
          Appointment modes are used to categorize appointments. You can create, edit, and delete appointment modes here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Each
            of={appointmentModes ?? []}
            render={(appointmentMode) => {
              return (
                <ListItem 
                  key={appointmentMode.id}
                  name={appointmentMode.name}  
                  description={appointmentMode.description}
                  actions={<Actions
                    appointmentMode={appointmentMode}
                    deleteAction={() => {
                      deleteAppointmentMode(appointmentMode.id)
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
  appointmentMode: GetAppointmentModes[number];
  editAction?: () => void;
  deleteAction?: () => void;
}
export const Actions = ({deleteAction, editAction, appointmentMode}: ActionsProps) => {
  return (
    <div className="flex gap-1">
      <UpdateAppointmentModeModal
        appointmentMode={appointmentMode}
        onAddAppointmentMode={editAction}
      />
      <Button onClick={deleteAction} variant="ghost" size="icon" >
        <Trash size={16} className="text-destructive"/>
      </Button>
    </div>
  )
}