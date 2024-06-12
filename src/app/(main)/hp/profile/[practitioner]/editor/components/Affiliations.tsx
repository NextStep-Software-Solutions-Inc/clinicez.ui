"use client";
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
import { Button } from "@components/ui/button";
import Each from "@components/utils/Each";
import { HPProfileType } from "../hp-form.schema";

export const Affiliations = ({ form }: { form: ReturnType<typeof useForm<HPProfileType>>; }) => {
  const { fields, remove, append, update } = useFieldArray({
    control: form.control,
    name: "affiliations"
  });
  return (
    <FormField
      control={form.control}
      name="affiliations"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Affiliations</FormLabel>
          <div className="flex flex-wrap gap-2">
            <Each
              of={fields}
              render={(_field, index) => {
                return (
                  <FormField
                    key={_field.id}
                    control={form.control}
                    name={`affiliations.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="Enter affiliation" {...field} />
                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                );
              }} />
          </div>
          <FormDescription>
            This will reflect in you public profile.
          </FormDescription>
          <FormMessage />
          <Button type="button" onClick={() => append({ name: "" })}>Add Affiliation</Button>
        </FormItem>
      )} />
  );
};
