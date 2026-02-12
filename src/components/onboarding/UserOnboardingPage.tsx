"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gender } from "@prisma/client";
import { toast } from "sonner";
import { Card, CardContent } from "@components/ui/card";
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
import ShellAccountBanner from "./ShellAccountBanner";
import {
  onboardingBasicInfoSchema,
  type OnboardingBasicInfoValues,
} from "@/schemas/onboarding.schema";
import { completeBasicOnboardingAction } from "@/actions/onboarding/user-onboarding.action";
import { capitalize } from "@lib/utils";

interface UserOnboardingData {
  id: number;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  mobile: string | null;
  dob: Date | null;
  gender: string | null;
  picture: string | null;
  onboardingStatus: string;
  profileCompletionStatus: string;
  accountType: string;
  firstLogin: Date | null;
  onboardingCompletedAt: Date | null;
}

interface UserOnboardingPageProps {
  userData: UserOnboardingData;
}

export default function UserOnboardingPage({
  userData,
}: UserOnboardingPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isShellAccount = userData.accountType === "SHELL";

  const form = useForm<OnboardingBasicInfoValues>({
    resolver: zodResolver(onboardingBasicInfoSchema),
    defaultValues: {
      firstName: userData.firstName ?? "",
      lastName: userData.lastName ?? "",
      dob: userData.dob ? new Date(userData.dob) : undefined,
      gender: (userData.gender as OnboardingBasicInfoValues["gender"]) ?? undefined,
      mobile: userData.mobile ?? "",
    },
  });

  const handleSubmit = useCallback(
    async (values: OnboardingBasicInfoValues) => {
      setIsLoading(true);
      try {
        const result = await completeBasicOnboardingAction(values);
        if (result.status) {
          toast.success("Welcome to Clinic EZ! Your profile is all set.");
          router.push("/?onboarding=complete");
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to complete onboarding.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isShellAccount ? "Claim Your Account" : "Welcome to Clinic EZ"}
        </h1>
        <p className="text-muted-foreground">
          {isShellAccount
            ? "Complete your profile to activate your account."
            : "Tell us a bit about yourself to get started."}
        </p>
      </div>

      {isShellAccount && (
        <ShellAccountBanner firstName={userData.firstName} />
      )}

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                <p className="text-sm text-muted-foreground">
                  All fields are required to complete your profile setup.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
                          {...field}
                        />
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
                        Last Name{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your last name"
                          {...field}
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
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date of Birth{" "}
                        <span className="text-destructive">*</span>
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
                        Gender{" "}
                        <span className="text-destructive">*</span>
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
                      Phone Number{" "}
                      <span className="text-destructive">*</span>
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

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Completing..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
