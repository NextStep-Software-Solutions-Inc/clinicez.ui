"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { useSystems } from "@hooks/useSystem";
import { deleteSystemAction, GetSystems } from "@actions/system.action";
import AddSystemModal from "./modal/AddSystemModal";
import UpdateSystemModal from "./modal/UpdateSystemModal";

interface SystemListProps {
}
export default function SystemList({}:SystemListProps) {
  const params = useParams<{clinicUid: string}>()
  const {data: systems, isLoading, mutate} = useSystems(params.clinicUid)

  const deleteServiceCategory = (id: number) => {
    toast.promise(deleteSystemAction(id), {
      loading: "Deleting system...",
      success: res => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to delete system"
    })
  }

  if(isLoading) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Systems 
          </span>
          <AddSystemModal clinicUid={params.clinicUid} onAddSystem={mutate}/>
        </CardTitle>
        <CardDescription>
          Systems are used to categorize appointments. You can create, edit, and delete systems here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Each
            of={systems ?? []}
            render={(system) => {
              return (
                <ListItem 
                  key={system.id}
                  name={system.name}
                  actions={<Actions
                    system={system}
                    deleteAction={() => {
                      deleteServiceCategory(system.id)
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
  system: GetSystems[number];
  editAction?: () => void;
  deleteAction?: () => void;
}
export const Actions = ({deleteAction, editAction, system}: ActionsProps) => {
  return (
    <div className="flex gap-1">
      <UpdateSystemModal
        system={system}
        onUpdateSystem={editAction}
      />
      <Button onClick={deleteAction} variant="ghost" size="icon" >
        <Trash size={16} className="text-destructive"/>
      </Button>
    </div>
  )
}