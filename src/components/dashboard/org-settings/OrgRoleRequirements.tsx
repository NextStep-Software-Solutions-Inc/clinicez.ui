"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Each from "@components/utils/Each";
import { setOrgRoleRequirementsAction } from "@actions/organizations/organization-role.action";

export const requirements = ["student_record", "employee_record"]

const FormSchema = z.object({
  requirements: z.array(z.string()).refine((value) => value.every((item) => item), {
    message: "Selected requirements cannot be empty",
  }),
})
  
interface OrgRoleRequirementsProps {
  orgRoleId: number
  currentRequirements: typeof requirements
}

export default function OrgRoleRequirements({orgRoleId, currentRequirements}:OrgRoleRequirementsProps ) {
  const params = useParams<{organization: string}>()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      requirements: currentRequirements,
    },
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(setOrgRoleRequirementsAction(orgRoleId, data.requirements), {
        loading: "Saving changes...",
        success: res => {
          if(res.status){
            form.reset(data)
          }
          return res.message
        },
        error: "Error while saving changes",
      })
    })();
  }
  
  return (
    <Form {...form}>
      <form action={action} className="space-y-8">
        <FormField
          control={form.control}
          name="requirements"
          render={() => (
            <FormItem>
              <div className="mb-4 ">
                <FormLabel className="text-base font-medium">Select Application Requirements</FormLabel>
                <FormDescription>
                  Select the requirements that are needed for this role to be able to submit an application.
                </FormDescription>
              </div>
              <div className="mb-4 flex gap-3 flex-wrap items-center">
                <Each
                  of={requirements}
                  render={(requirement) => {
                    return (
                      <FormField
                        key={requirement}
                        control={form.control}
                        name="requirements"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={requirement}
                              className="flex flex-row items-start space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(requirement)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, requirement])
                                      : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== requirement
                                        )
                                      )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal capitalize">
                                {requirement.split("_").join(" ")}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    )
                  }}
                />
              </div>
                    
              <FormMessage />
            </FormItem>
          )}
        />
        {
          form.formState.isDirty &&
            <ActionButton type="submit">Save Changes</ActionButton>
        }
      </form>
    </Form>
  )
}