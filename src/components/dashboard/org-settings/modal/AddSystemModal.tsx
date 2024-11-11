"use client";

import { createSystemAction } from "@actions/system.action";
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

const addSystemSchema = z.object({
  name: z.string({
    required_error: "Please provide a name for the system"
  }).trim().min(3, {
    message: "Name must be at least 3 characters long"
  })
});

interface AddSystemModalProps {
    orgUid: string;
    onAddSystem?: () => void;
}
export default function AddSystemModal({orgUid, onAddSystem}: AddSystemModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof addSystemSchema>>({
    resolver: zodResolver(addSystemSchema),
    defaultValues: {
      name: "",
    }
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(createSystemAction({...values, orgUid}), {
        loading: "Creating system...",
        success: res => {
          if(res.status) {
            onAddSystem?.()
            closeBtnRef.current?.click()
          }
          return res.message
        },
        error: "Failed to create system"
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
              Add System
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add System</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Add System" 
        description="Create a new system for the organization."
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
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
