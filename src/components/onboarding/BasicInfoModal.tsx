"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gender } from "@prisma/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { DatePicker } from "@components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";
import {
  onboardingBasicInfoSchema,
  type OnboardingBasicInfoValues,
} from "@/schemas/onboarding.schema";
import { completeBasicOnboardingAction } from "@/actions/onboarding/user-onboarding.action";
import { capitalize } from "@lib/utils";

interface BasicInfoModalProps {
  firstName: string | null;
  lastName: string | null;
  dob: Date | null;
  gender: string | null;
  mobile: string | null;
}

export default function BasicInfoModal({
  firstName,
  lastName,
  dob,
  gender,
  mobile,
}: BasicInfoModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingBasicInfoValues>({
    resolver: zodResolver(onboardingBasicInfoSchema),
    defaultValues: {
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      dob: dob ? new Date(dob) : undefined,
      gender:
        (gender as OnboardingBasicInfoValues["gender"]) ?? undefined,
      mobile: mobile ?? "",
    },
  });

  const handleSubmit = useCallback(
    async (values: OnboardingBasicInfoValues) => {
      setIsLoading(true);
      try {
        const result = await completeBasicOnboardingAction(values);
        if (result.status) {
          toast.success("Your profile is all set!");
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to save your information.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete Your Basic Information</DialogTitle>
          <DialogDescription>
            Please fill in your basic details to continue using Clinic EZ. All
            fields are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date of Birth <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={field.onChange}
                        placeholder="Select your date of birth"
                        toDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Gender <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Gender).map((g) => (
                          <SelectItem key={g} value={g}>
                            {capitalize(g.toLowerCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
