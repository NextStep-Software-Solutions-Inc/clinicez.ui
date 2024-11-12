"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { useClinicServiceCategories } from "@/hooks/useClinicServiceCategory";
import { deleteServiceCategoryAction, GetClinicServiceCategories } from "@/actions/clinics/clinic-service-category.action";
import AddServiceCategoryModal from "./modal/AddServiceCategoryModal";
import UpdateServiceCategoryModal from "./modal/UpdateServiceCategoryModal";
import ServiceList from "./ServiceList";

export default function ServiceCategoryList() {
  const params = useParams<{clinicUid: string}>()
  const {data: serviceCategories, isLoading, mutate} = useClinicServiceCategories(params.clinicUid)

  const deleteServiceCategory = (id: number) => {
    toast.promise(deleteServiceCategoryAction(id), {
      loading: "Deleting service category...",
      success: res => {
        if(res.status) {
          mutate()
        }
        return res.message
      },
      error: "Failed to delete service category"
    })
  }

  if(isLoading) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Service Categories 
          </span>
          <AddServiceCategoryModal clinicUid={params.clinicUid} onAddServiceCategory={mutate}/>
        </CardTitle>
        <CardDescription>
          Service categories are used to categorize services. You can create, edit, and delete service categories here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <Each
            of={serviceCategories ?? []}
            render={(serviceCategory) => {
              return (
                <Card key={serviceCategory.id}>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
                      <span>{serviceCategory.name}</span>
                      <Actions 
                        serviceCategory={serviceCategory}
                        editAction={mutate}
                        deleteAction={() => deleteServiceCategory(serviceCategory.id)}
                      />
                    </CardTitle>
                    <CardDescription>{serviceCategory.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ServiceList categoryId={serviceCategory.id}/>
                  </CardContent>
                </Card>
              )
            }}
          />
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}



interface ActionsProps {
  serviceCategory: GetClinicServiceCategories[number];
  editAction?: () => void;
  deleteAction?: () => void;
}
export const Actions = ({deleteAction, editAction, serviceCategory}: ActionsProps) => {
  return (
    <div className="flex gap-1">
      <UpdateServiceCategoryModal
        serviceCategory={serviceCategory}
        onUpdateServiceCategory={editAction}
      />
      <Button onClick={deleteAction} variant="destructive" size="sm" >
        <Trash size={16}/>
      </Button>
    </div>
  )
}