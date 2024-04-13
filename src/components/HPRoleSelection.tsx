"use client"

import { useFormState } from "react-dom"
import Each from "./utils/Each";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group"
import { toast } from "sonner"
import { submitRoleAction } from "@actions/healthcare-provider";
import { cn } from "@lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import SubmitAndNext from "@components/SubmitAndNext";
import { useContext } from "react";
import { HPApplicationDataContext } from "@contexts/hp-application.context";

const FormSchema = z.object({
  role: z.enum(["doctor", "nurse", "pharmacist", "laboratory", "admin"], {
    required_error: "You need to select a role.",
    invalid_type_error: "Invalid role",
  }),
})

const formHandler = async (_prevState: any, formData: FormData) => {
  const res = await submitRoleAction(_prevState, formData);
  toast("Your selected role has been submitted.", {
    action: {
      label: "Close",
      onClick: () => console.log("Undo"),
    },
    description: JSON.stringify(res.message, null, 2),
  });
  return res;
}

interface IHealthcareRoleSelectorProps {
    defaultRole?: string;
    roles: string[]
}

export default function HealthcareRoleSelector({defaultRole = "", roles = []}: IHealthcareRoleSelectorProps) {
  const {dispatch} = useContext(HPApplicationDataContext);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [state, formAction] = useFormState(formHandler, {
    message: "",
    status: false,
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      role: defaultRole as z.infer<typeof FormSchema>["role"],
    }
  })

  const action = async (formData: FormData) => {
    form.handleSubmit((data: z.infer<typeof FormSchema>) => {
      dispatch({selectedRole: data.role})
      formAction(formData)
    })();
  }
  return (
    <Form {...form}>
      <FormMessage><p className={cn(state.status? "text-green-500": "")}>{state.message}</p></FormMessage>
      <form 
        action={action} 
        className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field,  }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Role...</FormLabel>
              <FormControl>
                <RadioGroup
                  name="role"
                  onValueChange={(value) => {
                    field.onChange(value)
                    router.push(`?${searchParams.toString()}&role=${value}`)
                  }}
                  value={field.value}
                  className="flex flex-row space-x-5"
                >
                  <Each
                    of={roles}
                    render={(_role) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={_role}/>
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {_role}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <SubmitAndNext nextIndex="plan" labels={{submit: "Save"}} />
      </form>
    </Form>
  );
}
