"use client";

import { addWhitelistFilterAction } from "@actions/filter.action";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFilters } from "@hooks/useFilters";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addWhitelistFilterSchema = z.object({
  filterId: z.number({
    coerce: true,
    required_error: "Please select a filter"
  }),
  value: z.string({
    required_error: "Please provide a value for the filter"
  }).trim().min(1, {
    message: "Filter value must be at least 1 character long"
  })
});

interface AddWhitelistFilterProps {
    whitelistId: number;
    onAddWhitelistFilter?: () => void;
}
export default function AddWhitelistFilter({whitelistId, onAddWhitelistFilter}:AddWhitelistFilterProps) {
  const {data: filters, isLoading: loadingFilters} = useFilters();
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof addWhitelistFilterSchema>>({
    resolver: zodResolver(addWhitelistFilterSchema),
    defaultValues: {
      value: ""
    }
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(addWhitelistFilterAction({
        filterId: values.filterId,
        value: values.value,
        whitelistId
      }), {
        loading: "Adding whitelist filter...",
        success: res => {
          if(res.status) {
            onAddWhitelistFilter?.();
            closeBtnRef.current?.click();
          }
          return res.message
        },
        error: "An error occurred while adding whitelist filter."
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
              Add Whitelist Filter
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Whitelist Filter</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Add Whitelist Filter" 
        description="Add a whitelist filter to the whitelist."
      >
        <Form {...form}>
          <form 
            action={action}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="filterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filter</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select what do you want to filter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={filters?.data ?? []}
                          render={(filter) => (
                            <SelectItem key={filter.id} value={filter.id.toString()}>{filter.name} (<span className="italic">{filter.key}</span>)</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Select a filter for the whitelist.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <Input
                    id="value"
                    type="text"
                    placeholder="Enter value for the filter"
                    {...field}
                  />
                  <FormDescription>
                    Provide a value for the filter.
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
