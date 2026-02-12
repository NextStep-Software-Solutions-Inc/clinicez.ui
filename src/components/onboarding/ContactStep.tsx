"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import {
  onboardingStep2Schema,
  type OnboardingStep2Values,
} from "@/schemas/onboarding.schema";

interface ContactStepProps {
  defaultValues: Partial<OnboardingStep2Values>;
  onSubmit: (values: OnboardingStep2Values) => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function ContactStep({
  defaultValues,
  onSubmit,
  onBack,
  isLoading,
}: ContactStepProps) {
  const form = useForm<OnboardingStep2Values>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: {
      mobile: defaultValues.mobile ?? "",
      email: defaultValues.email ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Contact Information</h2>
          <p className="text-sm text-muted-foreground">
            We need your contact details so we can reach you. All fields on this
            page are required.
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email Address <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone Number <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="e.g. 09171234567"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
