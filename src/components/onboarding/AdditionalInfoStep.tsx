"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BloodType, CivilStatus } from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";
import {
  onboardingStep3Schema,
  type OnboardingStep3Values,
} from "@/schemas/onboarding.schema";
import { capitalize } from "@lib/utils";

interface AdditionalInfoStepProps {
  defaultValues: Partial<OnboardingStep3Values>;
  onSubmit: (values: OnboardingStep3Values) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export default function AdditionalInfoStep({
  defaultValues,
  onSubmit,
  onBack,
  onSkip,
  isLoading,
}: AdditionalInfoStepProps) {
  const form = useForm<OnboardingStep3Values>({
    resolver: zodResolver(onboardingStep3Schema),
    defaultValues: {
      middleName: defaultValues.middleName ?? "",
      suffix: defaultValues.suffix ?? "",
      nickname: defaultValues.nickname ?? "",
      placeOfBirth: defaultValues.placeOfBirth ?? "",
      civilStatus: defaultValues.civilStatus ?? undefined,
      bloodType: defaultValues.bloodType ?? undefined,
      telephone: defaultValues.telephone ?? "",
      religion: defaultValues.religion ?? "",
      nationality: defaultValues.nationality ?? "",
    },
  });

  const formatEnumLabel = (value: string) =>
    capitalize(value.toLowerCase().replace(/_/g, " "));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Additional Information</h2>
          <p className="text-sm text-muted-foreground">
            These fields are optional. You can fill them in now or complete them
            later from your profile settings.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Middle name"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suffix</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Jr., Sr., III"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nickname</FormLabel>
                <FormControl>
                  <Input
                    placeholder="What should we call you?"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="civilStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Civil Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select civil status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CivilStatus).map((cs) => (
                      <SelectItem key={cs} value={cs}>
                        {formatEnumLabel(cs)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bloodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(BloodType).map((bt) => (
                      <SelectItem key={bt} value={bt}>
                        {formatEnumLabel(bt)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="placeOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of Birth</FormLabel>
                <FormControl>
                  <Input
                    placeholder="City or municipality"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telephone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Landline number"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="religion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Religion</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your religion"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your nationality"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isLoading}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
