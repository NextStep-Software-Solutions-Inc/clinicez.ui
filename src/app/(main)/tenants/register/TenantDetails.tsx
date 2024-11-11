"use client";

import { z } from "zod";
import BackSubmitAndNext from "../../../../components/SubmitAndNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useAtom } from "jotai";
import { tenantApplyAtom } from "@state/tenant-apply";
import { Textarea } from "@components/ui/textarea";
import { createTenantAction } from "@actions/tenant.action";


type TenantDetails = z.infer<typeof tenantDetailsFormSchema>;
const tenantDetailsFormSchema = z.object({
  tenantUid: z.string({
    message: "Tenant unique identifier is required.",
    required_error: "Tenant Unique ID is required."
  }).trim().min(5),
  name: z.string({
    message: "Tenant name is required.",
    required_error: "Tenant name is required."
  }).trim().min(5).max(50),
  description: z.string().trim()
})

interface TenantDetailsProps {
  prevStep?: () => void;
  nextStep?: () => void;
  setComplete?: (value: boolean) => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}
export default function TenantDetails({ setComplete, prevStep }: TenantDetailsProps) {
  const searchParams = useSearchParams();
  const [tenantApplication, setTenantApplication] = useAtom(tenantApplyAtom);

  const form = useForm<TenantDetails>({
    resolver: zodResolver(tenantDetailsFormSchema),
    defaultValues: {
      tenantUid: tenantApplication.name || "",
      name: tenantApplication.name || "",
      description: tenantApplication.description || ""
    }
  })

  const action = async () =>{
    form.handleSubmit(async (data) => {
      setTenantApplication(prev => ({...prev, ...data}));
      if(!tenantApplication.receiptCode){
        toast.error("Receipt code is required."); 
        return;
      }
      const planId = Number(searchParams.get("plan"));
      toast.promise(createTenantAction({
        name: data.name,
        tenantUid: data.tenantUid,
        description: data.description,
        receiptCode: tenantApplication.receiptCode,
        planId: tenantApplication.planId || planId
      }), {
        loading: "Creating tenant...",
        success: (res) => {
          if(res.status){
            setComplete?.(true);
            form.reset(data);
          }
          return res.message;
        },
        error: "Failed to create tenant"
      })
    })()
  } 

  return (
    <Form {...form}>
      <div className="prose max-w-full mt-5">
        <h3 className="">Tenant Details</h3>
        <p>
          Provide the necessary details to create your new tenancy.
        </p>
      </div>
      <form action={action} className="space-y-6 shadow-lg w-full p-8 bg-white rounded-md">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="tenantUid"
            render={({ field }) => (
              <FormItem className="space-y-3 flex-1">
                <FormLabel>Tenant unique identifier</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  This will be used to uniquely identify your tenancy. Note: This cannot be changed once set.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-3 flex-1">
                <FormLabel>Tenant display name</FormLabel>
                <FormControl>
                  <Input placeholder="Name of your company or institution" {...field} />
                </FormControl>
                <FormDescription>
                  This will be the display name of your tenancy.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-3 flex-1">
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  A brief description of your tenancy.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4">
          <BackSubmitAndNext
            labels={{
              previous: "Back",
              submit: "Submit",
            }}
            disabled={{
              submit: !form.formState.isValid,
              next: true,
            }}
            actions={{
              previous: prevStep,
            }}
          />
        </div>
      </form>
    </Form>
  )
}
