"use client";

import React, { useRef } from "react";
import {
  DialogClose,
  DialogFooter
} from "@components/ui/dialog";
import { Form } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createUserVaccinationAction } from "@actions/user-vaccination.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import { revalidatePath } from "@actions/cache.action";
import { VaccineType } from "./modal/AddUserVaccinationModal";
import { UserVaccinationForm, VaccinationForm, vaccinationFormSchema } from "./UserVaccinationForm";




interface AddUserVaccinationFormProps {
  vaccines: VaccineType[];
}
export const AddUserVaccinationForm = ({ vaccines }: AddUserVaccinationFormProps) => {

  const closeBtnRef = useRef<HTMLInputElement>(null);
  const user = useUser();
  const userId = user?.user?.sub;
  const form = useForm<VaccinationForm>({
    resolver: zodResolver(vaccinationFormSchema)
  });

  const action = async () => {
    form.handleSubmit(async (data) => {

      if (!userId) return toast.error("User not found");
      toast.promise(createUserVaccinationAction({ ...data, userId }), {
        loading: "Saving...",
        success: () => {
          closeBtnRef.current?.click();
          revalidatePath(`/user/[user]/phr/vaccination-immunization`);
          return "Vaccination Added";
        },
        error: "Failed to add vaccination"
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
            Add Vaccination
          </ActionButton>
        </DialogFooter>
      </form>
    </Form>
  );
};
