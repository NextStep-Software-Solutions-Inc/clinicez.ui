"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AllergenComboBox } from "./AllergenComboBox";
import { z } from "zod";
import DeleteAllergyButton from "./DeleteAllergyButton";
import DoneEditingButton from "./DoneEditingButton";

export const allergySchema = z.object({
  id: z.number(),
  allergen: z.string({
    required_error: "Allergen is required."
  }).refine(value => value.trim() !== "", {
    message: "Allergen is required.",
  }),
  reaction: z.string().min(2, {
    message: "Reaction must be at least 2 characters.",
  }).max(255, {
    message: "Reaction must not be longer than 30 characters.",
  }),
  notes: z.string().nullable()
})
  
export  type Allergy = z.infer<typeof allergySchema>;
  
interface AllergyFormProps {
    allergy: Allergy, 
    index: number, 
    onUpdate: (index: number, value: Allergy) => void,
    remove: (index: number) => void
  }
  
export const EditAllergyForm = ({allergy, index, onUpdate, remove}: AllergyFormProps) => {
    
  const form = useForm<Allergy>({
    resolver: zodResolver(allergySchema),
    defaultValues: allergy
  })
  
  return (
    <Form {...form}>
      <Card className="ring-2 m-1">
        <CardHeader>
          <CardTitle className="flex flex-col group/actions gap-2">
            <div className="ml-auto flex space-x-2 group-hover/actions:visible transition-all">
              <DoneEditingButton index={index} update={onUpdate} form={form}/>
              <DeleteAllergyButton id={allergy.id} index={index} remove={remove}/>
            </div>
            <FormField
              control={form.control}
              name="allergen"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col w-full">
                  <FormLabel>Allergen</FormLabel>
                  <AllergenComboBox
                    value={field.value}
                    onChange={(value) => form.setValue("allergen", value)}
                  />
                  <FormDescription>
                      What food or medicine you are allergic to?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
              
          </CardTitle>
          <Separator/>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="reaction"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Reaction</FormLabel>
                  <FormControl>
                    <Input placeholder="Itchiness" {...field}  />
                  </FormControl>
                  <FormDescription>
                      What reaction usually happen?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} value={field.value ?? ""}  />
                  </FormControl>
                  <FormDescription>
                      Additional information about the allergy.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </Form>
  )
}
  
