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

export const Education = ({ form }: { form: ReturnType<typeof useForm<HPProfileType>>; }) => {
  const { fields, remove, append, update } = useFieldArray({
    control: form.control,
    name: "educations"
  });
  return (
    <FormField
      control={form.control}
      name="educations"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Education</FormLabel>
          <div className="flex flex-wrap gap-2">
            <Each
              of={fields}
              render={(_field, index) => {
                return (
                  <FormField
                    key={_field.id}
                    control={form.control}
                    name={`educations.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="Enter schooling or seminars" {...field} />
                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                );
              }} 
            />
          </div>
          <FormDescription>
            {`You can add the schools you've attended or seminars you've participated in. This will help patients know your educational background.`}
          </FormDescription>
          <FormMessage />
          <Button type="button" onClick={() => append({ name: "" })}>Add Education</Button>
        </FormItem>
      )} />
  );
};
