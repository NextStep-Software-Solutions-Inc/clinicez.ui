"use client";
import { z } from "zod";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { useFieldArray, useForm } from "react-hook-form";
import { formSchema } from "../../profile/[practitioner]/editor/HPForm";
import { Button } from "@components/ui/button";
import Each from "@components/utils/Each";

export const Specialties = ({ form }: { form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>; }) => {
  const { fields, remove, append, update } = useFieldArray({
    control: form.control,
    name: "specialties"
  });
  return (
    <FormField
      control={form.control}
      name="specialties"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Specialties</FormLabel>
          <Each
            of={fields}
            render={(_field, index) => {
              return (
                <FormField
                  key={_field.id}
                  control={form.control}
                  name={`specialties.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="What do you specialize?" {...field} />
                          <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
              );
            }} />
          <FormDescription>
            This will reflect in you public profile.
          </FormDescription>
          <FormMessage />
          <Button type="button" onClick={() => append({ name: "" })}>Add Specialty</Button>
        </FormItem>
      )} />
  );
};
