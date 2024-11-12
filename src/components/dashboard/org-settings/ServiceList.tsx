"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { useClinicServices } from "@/hooks/useClinicService";
import { deleteClinicServiceAction, GetClinicServices } from "@actions/organizations/clinic-service.action";
import AddServiceModal from "./modal/AddServiceModal";
import UpdateServiceModal from "./modal/UpdateServiceModal";

interface ServiceListProps {
  categoryId?: number;
}
export default function ServiceList({categoryId}:ServiceListProps) {
  const params = useParams<{clinicUid: string}>()
  const {data: services, isLoading, mutate} = useClinicServices({
    clinicUid: params.clinicUid,
    categoryId
    
  })

  const deleteServiceCategory = (id: number) => {
    toast.promise(deleteClinicServiceAction(id), {
      loading: "Deleting service...",
      success: res => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to delete service"
    })
  }

  if(isLoading) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Services 
          </span>
          <AddServiceModal clinicUid={params.clinicUid} onAddService={mutate}/>
        </CardTitle>
        <CardDescription>
          Services are used to categorize appointments. You can create, edit, and delete services here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Each
            of={services ?? []}
            render={(service) => {
              return (
                <ListItem 
                  key={service.id}
                  name={`${service.name} - ${service.ServiceAttribute?.duration} minutes duration, ${service.ServiceAttribute?.durationPadding} minutes padding/buffer`}
                  description={service.description}
                  actions={<Actions
                    service={service}
                    deleteAction={() => {
                      deleteServiceCategory(service.id)
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
  service: GetClinicServices[number];
  editAction?: () => void;
  deleteAction?: () => void;
}
export const Actions = ({deleteAction, editAction, service}: ActionsProps) => {
  return (
    <div className="flex gap-1">
      <UpdateServiceModal
        service={service}
        onUpdateService={editAction}
      />
      <Button onClick={deleteAction} variant="ghost" size="icon" >
        <Trash size={16} className="text-destructive"/>
      </Button>
    </div>
  )
}