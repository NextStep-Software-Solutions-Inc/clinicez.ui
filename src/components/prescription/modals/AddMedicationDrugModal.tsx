"use client";

import { addMedicationDrugAction } from "@actions/medications/medication-drug.action";
import { createMedicationAction } from "@actions/medications/medication.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDrugs } from "@hooks/useDrug";

import { Pill } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface AddMedicationDrugModalProps {
  onCreated?: () => void;
  medicationId: number;
}

type CreatePrescriptionForm = z.infer<typeof createPrescriptionFormSchema>;
const createPrescriptionFormSchema = z.object({
  drugId: z.number({
    coerce: true,
    message: "Drug is required"
  }),
  isGeneric: z.boolean().default(false),
  dosage: z.string({
    message: "Dosage is required"
  }),
  frequency: z.string({
    message: "Frequency is required"
  }),
  unit: z.string({
    message: "Unit is required"
  }).trim(),
  notes: z.string().optional(),
  duration: z.number({
    coerce: true,
    message: "Duration is required"
  })
});

export default function AddMedicationDrugModal({onCreated, medicationId}: AddMedicationDrugModalProps) {
  const closeBtnRef = useRef<HTMLInputElement>(null);
  
  const { data: drugs } = useDrugs();

  const form = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionFormSchema),
  });

  const action = async () => {
    form.handleSubmit((data) => {
      toast.promise(addMedicationDrugAction({
        ...data, 
        medicationId,
      }), {
        loading: "Adding medication drug...",
        success: (res) => {
          if (res.status) {
            onCreated?.();
            closeBtnRef.current?.click();

            form.reset(data);
          }
          return res.message;
        },
        error: "Failed to add medication drug"
      });
    })();
  };
 
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Pill className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Add Medicine
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[725px] overflow-scroll max-h-[100vh] no-scrollbar"
        label="Add Medicine"
        description="Add a new medicine to the medication list"
      >
        <Form {...form}>
          <form
            action={action}
            className="space-y-6"
          >

            <FormField
              control={form.control}
              name="drugId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drug*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    name={field.name}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a drug" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={drugs?.data ?? []}
                        render={(drug) => (
                          <SelectItem value={drug.id.toString()}>
                            {drug.genericName} ({drug.brandName})
                          </SelectItem>
                        )}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isGeneric"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Prefer Generic
                    </FormLabel>
                    <FormDescription>
                      Check this box if you prefer generic medicine
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex items-baseline flex-wrap gap-2">
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Dosage*</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter dosage"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                    Dosage of the medicine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit*</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter unit"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      e.g tablet, capsule, drops etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Frequency*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter frequency"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      How often to take the medicine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Total days"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days to take the medicine in total.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add notes for the medicine
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <input
                  ref={closeBtnRef}
                  type="hidden"
                  value="ok"
                />
              </DialogClose>
              <ActionButton type="submit">Add Medicine</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
