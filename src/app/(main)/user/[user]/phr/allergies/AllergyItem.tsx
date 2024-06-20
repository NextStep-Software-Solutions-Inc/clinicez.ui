import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";


export const allergySchema = z.object({
  id: z.number(),
  allergen: z.string().min(2, {
    message: "Allergen must be at least 2 characters.",
  }).max(255, {
    message: "Allergen must not be longer than 30 characters.",
  }),
  reaction: z.string().min(2, {
    message: "Reaction must be at least 2 characters.",
  }).max(255, {
    message: "Reaction must not be longer than 30 characters.",
  })
})

type Allergy = z.infer<typeof allergySchema>;

interface AllergyItemProps {
  allergy: Allergy;
  index: number;
  remove: (index: number) => void;
  update: (index: number, data: Allergy) => void;
}

export default function AllergyItem({allergy, index, remove, update}: AllergyItemProps) {
  const [isEditing, setIsEditing] = React.useState(allergy.allergen === "");

  const form = useForm<Allergy>({
    resolver: zodResolver(allergySchema),
    defaultValues: allergy
  })

  const handleDoneEditing = () => {
    form.handleSubmit((data) => {
      update(index, data);
      setIsEditing(false);
    })();
  };
  
  return (
    <>
      <ConditionalRender condition={!isEditing}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center group/actions">
              <span>{allergy.allergen}</span>
              <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(index)}>Delete</Button>
              </span>
            </CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            <section>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <div className="font-semibold">Reaction</div>
                  <div>{allergy.reaction}</div>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing}>
        <Form {...form}>
          <form action={handleDoneEditing}>
            <Card className="ring-2 m-1">
              <CardHeader>
                <CardTitle className="flex items-center group/actions gap-2">
                  <FormField
                    control={form.control}
                    name="allergen"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Allergen</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter allergen" {...field}  />
                        </FormControl>
                        <FormDescription>
                          What food or medicine you are allergic to?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span  className="ml-auto space-x-2 group-hover/actions:visible transition-all">
                    <ActionButton size="sm" variant="ghost" >Done Editing</ActionButton>
                    <Button size="sm" variant="destructive" type="button" onClick={() => remove(index)}>Delete</Button>
                  </span>
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
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </ConditionalRender>
    </>
  );
}
