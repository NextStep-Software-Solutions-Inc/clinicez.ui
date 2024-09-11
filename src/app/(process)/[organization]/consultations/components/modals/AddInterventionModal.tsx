"use client";

import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { createInterventionAction } from "@actions/consultation/intervention.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActions } from "@hooks/useAction";
import { useHPs } from "@hooks/useHP";
import { useInterventions } from "@hooks/useIntervention";
import {  Plus } from "lucide-react"
import { useRef } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface AddInterventionModalProps {
  consultation: NonNullable<GetConsultationRecord["data"]>;
}

const AddInterventionFormSchema = z.object({
  hpId: z.coerce.number({
    required_error: "Please select a healthcare provider profile"
  }),
  actionId: z.coerce.number({
    required_error: "Please select an action"
  }),
  details: z.string({
    required_error: "Please provide details"
  })
})

export default function AddInterventionModal({consultation}: AddInterventionModalProps) {

  const { user } = useUser()
  const { data: actions } = useActions()
  const { data: myHps } = useHPs({
    userId: user?.sub ?? "", 
    isPublished: true
  })
  const { mutate } = useInterventions({
    orgUid: consultation.orgUid,
    consultationRecordId: consultation.id
  })
  
  type HPProfile = {
    id: number;
    type: string; 
    name: string;
    avatarUrl: string;
    fields: string[];
  }
  
  const hpsMapped = (myHps ?? []).reduce((acc, hp) => {
    const profile = {} as HPProfile
    profile.id = hp.id;
    profile.type = hp.type;
    switch (hp.type) {
    case "NURSE":
      profile.name = `${hp.NurseProfile?.title} ${hp.NurseProfile?.name} ${hp.NurseProfile?.suffix}` ?? "";
      profile.avatarUrl = hp.NurseProfile?.picture ?? "";
      profile.fields = hp.NurseProfile?.fields ?? [];
      break;
    case "DOCTOR":
      profile.name = `${hp.DoctorProfile?.title} ${hp.DoctorProfile?.name} ${hp.DoctorProfile?.suffix}` ?? "";
      profile.avatarUrl = hp.DoctorProfile?.picture ?? "";
      profile.fields = hp.DoctorProfile?.fields ?? [];
      break;
    default:
      break;
    }
    acc.push(profile)
    return acc
  }, [] as HPProfile[])

  const form = useForm<z.infer<typeof AddInterventionFormSchema>>({
    resolver: zodResolver(AddInterventionFormSchema)
  })

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      formData.append("consultationRecordId", consultation.id.toString())
      formData.append("orgUid", consultation.orgUid)
      toast.promise(createInterventionAction(formData), {
        loading: "Saving...",
        success: (res) => {
          if (res.status) {
            form.reset(data)
            mutate()
            closeBtnRef.current?.click();
          }
          return res.message
        },
        error: "Failed to add intervention"
      })
    })()
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Intervention
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Intervention</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Add Intervention" 
        description="Enter the intervention performed during the consultation."
      >
        <Form {...form}>
          <form 
            action={action}
            id="add-intervention-form"
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="hpId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your HP profile</FormLabel>
                  <Select onValueChange={field.onChange} name={field.name} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="HP profile to interact as" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={hpsMapped}
                        render={(hp) => 
                          <SelectItem value={hp.id.toString()}>{hp.name} ({hp.type})</SelectItem>}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} name={field.name} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select predefine interventions" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={actions?.data ?? []}
                        render={(action) => 
                          <SelectItem value={action.id.toString()}>{action.name}</SelectItem>}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If the intervention is not predefined, you can ask your organization admin to add it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <Input
                    id="details"
                    placeholder="Describe what was done during the intervention."
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Example of details: &quot;Administered 500mg of Paracetamol&quot;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="add-intervention-form" type="submit">
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  )
}
