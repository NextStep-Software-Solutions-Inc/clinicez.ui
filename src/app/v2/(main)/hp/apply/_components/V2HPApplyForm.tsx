"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { registerHPV2Action } from "@/actions/hp.actions";
import { useHPTypes } from "@/hooks/useHPTypes";
import Each from "@/components/utils/Each";
import { ArrowRight, CheckCircle2, Loader2, Stethoscope } from "lucide-react";

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
              <FormControl>
                <RadioGroup
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  <Each
                    of={hpTypes?.data ?? []}
                    render={(type) => {
                      const isSelected = field.value === type.id;
                      return (
                        <FormItem key={type.id}>
                          <FormControl>
                            <label
                              htmlFor={`hptype-${type.id}`}
                              className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:shadow-md ${
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-md"
                                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                              }`}
                            >
                              <RadioGroupItem
                                value={type.id.toString()}
                                id={`hptype-${type.id}`}
                                onClick={() => form.trigger()}
                                className="sr-only"
                              />
                              {/* Icon */}
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <Stethoscope size={22} />
                              </div>
                              {/* Label */}
                              <span className={`font-semibold capitalize text-sm leading-snug ${isSelected ? "text-primary" : "text-foreground"}`}>
                                {type.name.replaceAll("_", " ")}
                              </span>
                              {/* Selected checkmark */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 text-primary">
                                  <CheckCircle2 size={18} />
                                </div>
                              )}
                            </label>
                          </FormControl>
                        </FormItem>
                      );
                    }}
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
          size="lg"
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
