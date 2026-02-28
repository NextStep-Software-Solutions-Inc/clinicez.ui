import React from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import Each from "@components/utils/Each";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { VaccineType } from "./modal/AddUserVaccinationModal";
import { z } from "zod";

export const vaccinationFormSchema = z.object({
  dateGiven: z.date({
    required_error: "Date Given is required"
  }),
  administeredBy: z.string({
    required_error: "Administered By is required or Put N/A if not applicable",
    invalid_type_error: "Administered By is invalid"
  }),
  vaccineId: z.coerce.number({
    required_error: "Vaccine is required",
    invalid_type_error: "Vaccine is invalid",
  }),
  routeId: z.coerce.number({
    required_error: "Route is required",
    invalid_type_error: "Route is invalid"
  }),
  doseId: z.coerce.number({
    required_error: "Dose is required",
    invalid_type_error: "Dose is invalid"
  })
});
export type VaccinationForm = z.infer<typeof vaccinationFormSchema>;

interface UserVaccinationFormProps {
    vaccines: VaccineType[],
    form: ReturnType<typeof useForm<VaccinationForm>>
}

export const UserVaccinationForm = ({vaccines, form}:UserVaccinationFormProps) => {

  const vaccineId = parseInt(form.watch("vaccineId") as unknown as string);
  
  return (
    <>
      <FormField
        control={form.control}
        name="administeredBy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Administered By</FormLabel>
            <FormControl>
              <Input placeholder="Who administered the vaccine?" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>
                Enter the name of the person or organization who administered the vaccine.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      <FormField
        control={form.control}
        name="vaccineId"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Vaccine</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} name="vaccineId">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <Each
                  of={vaccines}
                  render={item => <SelectItem value={item.id?.toString()} className="cursor-pointer">{item.name}</SelectItem>} 
                />
              </SelectContent>
            </Select>
            <FormDescription>
                Select the vaccine administered.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      <div className="flex items-baseline gap-2">
        <FormField
          control={form.control}
          name="routeId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Route</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} name="vaccineId">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <Each
                    of={vaccines.find(v => v.id === vaccineId)?.VaccineRoutes ?? []}
                    render={item => <SelectItem value={item.Route.id.toString()} className="cursor-pointer">{item.Route.route}</SelectItem>} />
                </SelectContent>
              </Select>
              <FormDescription>
                    Select the route of administration.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        <FormField
          control={form.control}
          name="doseId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Dose</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} name="vaccineId">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dose" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <Each
                    of={vaccines.find(v => v.id === vaccineId)?.VaccineDoses ?? []}
                    render={item => <SelectItem value={item.Dose.id.toString()} className="cursor-pointer">{item.Dose.dose}</SelectItem>} />
                </SelectContent>
              </Select>
              <FormDescription>
                    Select the dose administered.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
      </div>
      <FormField
        control={form.control}
        name="dateGiven"
        render={({ field }) => (
          <FormItem className="flex flex-col flex-grow">
            <FormLabel className="leading-normal">Date Received</FormLabel>
            <Input
              name={field.name}
              onChange={e => field.onChange(new Date(e.target.value))}
              defaultValue={field.value ? format(field.value, "yyyy-MM-dd") : ""}
              type="date"
              placeholder="Select date" 
            />
            <FormDescription>
                Enter the date the vaccine was administered.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} 
      />
    </>
  );
};
