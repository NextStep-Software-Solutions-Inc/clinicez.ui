"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { registerHPV2Action } from "@/actions/hp.actions";
import { useHPTypes } from "@/hooks/useHPTypes";
import Each from "@/components/utils/Each";
import { ArrowRight, Loader2 } from "lucide-react";

const schema = z.object({
  hpTypeId: z.number({ coerce: true, message: "Please select a Healthcare Provider type." }),
});

type FormType = z.infer<typeof schema>;

export default function V2HPApplyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: hpTypes } = useHPTypes();

  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    mode: "all",
  });

  const handleSubmit = async (values: FormType) => {
    setIsSubmitting(true);
    try {
      const result = await registerHPV2Action({ hpTypeId: values.hpTypeId });
      if (result.status && result.data) {
        toast.success("Healthcare Provider profile created! Please complete your profile.");
        router.push(`/v2/hp/${result.data.id}/edit`);
      } else {
        toast.error(result.message ?? "Failed to create Healthcare Provider profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="hpTypeId"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-base font-semibold">Select your Healthcare Provider type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  <Each
                    of={hpTypes?.data ?? []}
                    render={(type) => (
                      <FormItem key={type.id}>
                        <FormControl>
                          <label
                            htmlFor={`hptype-${type.id}`}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                              field.value === type.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            <RadioGroupItem
                              value={type.id.toString()}
                              id={`hptype-${type.id}`}
                              onClick={() => form.trigger()}
                            />
                            <span className="capitalize font-medium text-sm">
                              {type.name.replaceAll("_", " ")}
                            </span>
                          </label>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Creating profile…
            </>
          ) : (
            <>
              Continue to Build Profile
              <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
