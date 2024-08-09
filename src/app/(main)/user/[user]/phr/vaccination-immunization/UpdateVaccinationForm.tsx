"use client";

import React, { useRef } from "react";
import {
  DialogClose,
  DialogFooter
} from "@components/ui/dialog";
import { Form } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createUserVaccinationAction, updateUserVaccinationAction } from "@actions/users/user-vaccination.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import { revalidatePath } from "@actions/cache.action";
import { VaccineType } from "./modal/AddUserVaccinationModal";
import { UserVaccinationType } from "./Vaccinations";
import { UserVaccinationForm } from "./UserVaccinationForm";


const updateVaccinationFormSchema = z.object({
  dateGiven: z.date({
    required_error: "Date Given is required"
  }),
  administeredBy: z.string(),
  vaccineId: z.coerce.number({
    required_error: "Vaccine is required"
  }),
  routeId: z.coerce.number({
    required_error: "Route is required"
  }),
  doseId: z.coerce.number({
    required_error: "Dose is required"
  })
});
export type UpdateVaccinationForm = z.infer<typeof updateVaccinationFormSchema>;

interface UpdateVaccinationFormProps {
  vaccines: VaccineType[];
  vaccination: UserVaccinationType;
}
export const UpdateVaccinationForm = ({ vaccines, vaccination }: UpdateVaccinationFormProps) => {

  const closeBtnRef = useRef<HTMLInputElement>(null);
  const user = useUser();
  const userId = user?.user?.sub;
  const form = useForm<UpdateVaccinationForm>({
    resolver: zodResolver(updateVaccinationFormSchema),
    defaultValues: {
      administeredBy: vaccination.administeredBy || "",
      dateGiven: vaccination.dateGiven,
      vaccineId: vaccination.Vaccine.id,
      routeId: vaccination.Route.id,
      doseId: vaccination.Dose.id,
    }
  });

  const action = async () => {
    form.handleSubmit(async (data) => {

      if (!userId) return toast.error("User not found");
      toast.promise(updateUserVaccinationAction(vaccination.id, {...data, userId}), {
        loading: "Saving...",
        success: () => {
          closeBtnRef.current?.click();
          revalidatePath(`/user/[user]/phr/vaccination-immunization`, "page");
          return "Vaccination Updated";
        },
        error: "Failed to update vaccination"
      });
    }, console.error)();
  };

  return (
    <Form {...form}>
      <form
        action={action}
        className="grid gap-4 py-4"
      >
        <UserVaccinationForm form={form} vaccines={vaccines} />
        <DialogFooter>
          <DialogClose asChild>
            <input ref={closeBtnRef} type="hidden" />
          </DialogClose>
          <ActionButton type="submit">
            Save Changes
          </ActionButton>
        </DialogFooter>
      </form>
    </Form>
  );
};
