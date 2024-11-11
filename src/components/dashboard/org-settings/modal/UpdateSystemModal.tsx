"use client";

import { GetSystems, updateSystemAction } from "@actions/system.action";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@components/ui/dialog";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updateSystemSchema = z.object({
  name: z.string({
    required_error: "Please provide a name for the system"
  }).trim().min(3, {
    message: "Name must be at least 3 characters long"
  })
});

interface UpdateSystemModalProps {
  system: GetSystems[number];
  onUpdateSystem?: () => void;
}
export default function UpdateSystemModal({system, onUpdateSystem}:UpdateSystemModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof updateSystemSchema>>({
    resolver: zodResolver(updateSystemSchema),
    values: {
      name: system.name
    }
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(updateSystemAction({...values, id: system.id}), {
        loading: "Updating system...",
        success: res => {
          if(res.status) {
            onUpdateSystem?.()
            closeBtnRef.current?.click()
          }
          return res.message
        },
        error: "Failed to update system"
      })
    })();
  }
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="text-primary" size={16} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Update System</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Update System" 
        description="Update the system for the organization."
      >
        <Form {...form}>
          <form 
            action={action}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Provide a name for the system.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton type="submit">
                Save Changes
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
