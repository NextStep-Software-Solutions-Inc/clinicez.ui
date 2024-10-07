"use client";

import { createOrgRoleAction } from "@actions/organizations/organization-role.action";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@components/ui/dialog";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addRoleSchema = z.object({
  name: z.string({
    required_error: "Please provide a name for the role"
  }).trim().min(3, {
    message: "Role name must be at least 3 characters long"
  }),
  description: z.string({
    required_error: "Please provide a description for the role"
  }).trim().min(3, {
    message: "Role description must be at least 3 characters long"
  })
});

interface AddRoleModalProps {
    orgUid: string;
    onAddRole?: () => void;
}
export default function AddRoleModal({orgUid, onAddRole}:AddRoleModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof addRoleSchema>>({
    resolver: zodResolver(addRoleSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(createOrgRoleAction({
        orgUid,
        name: values.name,
        description: values.description
      }), {
        loading: "Creating role...",
        success: res => {
          if(res.status) {
            onAddRole?.();
            closeBtnRef.current?.click();
          }
          return res.message
        },
        error: "Error while creating role"
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
              Add Role
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Role</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Add Intervention" 
        description="Enter the intervention performed during the consultation."
      >
        <Form {...form}>
          <form 
            action={action}
            id="add-intervention-form"
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter role name"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Provide a name for the role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <Textarea
                    id="description"
                    placeholder="Enter role description"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Provide a description for the role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="add-intervention-form" type="submit">
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
