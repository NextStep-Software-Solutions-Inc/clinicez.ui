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
import { HPProfileType } from "../../profile/[practitioner]/editor/hp-form.schema";

export const Certifications = ({ form }: { form: ReturnType<typeof useForm<HPProfileType>>; }) => {
  const { fields, remove, append, update } = useFieldArray({
    control: form.control,
    name: "certifications"
  });
  return (
    <FormField
      control={form.control}
      name="certifications"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Certifications</FormLabel>
          <FormControl>
            <Each
              of={fields}
              render={(_field, index) => {
                return (
                  <FormField
                    key={_field.id}
                    control={form.control}
                    name={`certifications.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="Enter acquired certificate" {...field} />
                            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                );
              }} />
          </FormControl>
          <FormDescription>
            This will reflect in you public profile.
          </FormDescription>
          <FormMessage />
          <Button type="button" onClick={() => append({ name: "" })}>Add Certification</Button>
        </FormItem>
      )} />
  );
};
