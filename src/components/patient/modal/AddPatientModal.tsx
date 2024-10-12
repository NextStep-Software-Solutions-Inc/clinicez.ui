"use client";

import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { $Enums, Gender } from "@prisma/common/client";
import { format } from "date-fns";
import Each from "@components/utils/Each";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useOrgRoles } from "@hooks/useOrgRole";
import { createUserAction } from "@actions/users/user.action";

const addUserSchema = z.object({
  firstName: z.string({
    required_error: "First name is required"
  }).trim().min(2, {
    message: "First name must be at least 2 characters long"
  }),
  lastName: z.string({
    required_error: "Last name is required"
  }).trim().min(2, {
    message: "Last name must be at least 2 characters long"
  }),
  email: z.string({
    required_error: "Email is required"
  }).trim().email({
    message: "Invalid email address"
  }),
  mobile: z.string({
    required_error: "Mobile number is required"
  }).trim(),
  gender: z.nativeEnum($Enums.Gender, {
    required_error: "Gender is required"
  }).refine(value => {
    return value 
  }, {
    message: "Invalid Gender"
  }),
  dob: z.date({
    coerce: true,
    required_error: "Date of birth is required"
  }),
  userRoleId: z.number({
    coerce: true,
  }).int().positive()
  
});

interface AddPatientModalProps {
    orgUid: string;
    onAddPatient?: () => void;
}
export default function AddPatientModal({orgUid, onAddPatient}:AddPatientModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const {data: orgRoles} = useOrgRoles(orgUid);
  const form = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(createUserAction({...values, orgUid}), {
        loading: "Adding patient...",
        success: res => {
          if(res.success){
            onAddPatient?.();
            closeBtnRef.current?.click();
          }
          return res.message
        },
        error: "Failed to add patient"
      })
      
    })();
  }
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Patient</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[625px]"
        label="Add Patient" 
        description="Add a new patient to the organization"
      >
        <Form {...form}>
          <form 
            action={action}
            id="add-patient-form"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem
                    className="grow"
                  >
                    <FormLabel>First name</FormLabel>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      className=""
                      {...field}
                    />
                    <FormDescription>
                    Enter the first name of the patient.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem
                    className="grow"
                  >
                    <FormLabel>Last name</FormLabel>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      className=""
                      {...field}
                    />
                    <FormDescription>
                    Enter the last name of the patient.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem
                    className="grow"
                  >
                    <FormLabel>Email</FormLabel>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="Enter email"
                      className=""
                      {...field}
                    />
                    <FormDescription>
                    Enter the email of the patient.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem
                    className="grow"
                  >
                    <FormLabel>Mobile Number (optional)</FormLabel>
                    <Input
                      id="mobile"
                      inputMode="tel"
                      placeholder="Enter mobile number"
                      className=""
                      {...field}
                    />
                    <FormDescription>
                    Enter the mobile number of the patient.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem
                  className="grow"
                >
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      {...field.value && { defaultValue: field.value }}
                      className="flex flex-row gap-5 flex-wrap"
                    >
                      <Each
                        of={Object.values(Gender).map(g => ({name: g.toLowerCase(), value:g}))}
                        render={(gender) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={gender.value} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {gender.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Enter the date of birth of the patient.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userRoleId"
              render={({ field }) => (
                <FormItem
                  className="grow"
                >
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={orgRoles ?? []}
                        render={(role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                        ) }
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a role for the patient.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem
                  className="grow"
                >
                  <FormLabel>Date of Birth</FormLabel>
                  <Input
                    id="dob"
                    type="date"
                    placeholder="Enter date of birth"
                    name={field.name}
                    onChange={e => field.onChange(new Date(e.target.value))}
                    defaultValue={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                  />
                  <FormDescription>
                    Enter the date of birth of the patient.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="add-patient-form" type="submit">
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
