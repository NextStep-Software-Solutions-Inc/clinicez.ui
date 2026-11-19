"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Heart, Loader2, RotateCcw, Save, ShieldAlert, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  updatePhilHealthSettingsAction,
  type GetClinicSetting,
} from "@/actions/clinics/clinic-setting.action";

type ClinicSettingData = NonNullable<GetClinicSetting["data"]>;

const philhealthSchema = z.object({
  philhealthAccreditationNumber: z.string().optional(),
  facilityName: z.string().optional(),
  philhealthYakapUsername: z.string().optional(),
  philhealthYakapPassword: z.string().optional(),
  philhealthYakapPmccNumber: z.string().optional(),
});

type PhilHealthFormValues = z.infer<typeof philhealthSchema>;

function buildCredentialPayload(
  rawValue: string | undefined,
  stagedClear: boolean,
  trim: boolean,
): string | null | undefined {
  if (stagedClear) {
    return null;
  }
  if (!rawValue || rawValue.trim().length === 0) {
    return undefined;
  }
  return trim ? rawValue.trim() : rawValue;
}

interface CredentialSecretFieldProps {
  control: Control<PhilHealthFormValues>;
  name: "philhealthYakapUsername" | "philhealthYakapPassword";
  label: string;
  entityLabel: string;
  inputType: "text" | "password";
  autoComplete: string;
  configured: boolean;
  stagedClear: boolean;
  onStageClear: () => void;
  onUndoClear: () => void;
  onTypedNonEmpty: () => void;
}

function CredentialSecretField({
  control,
  name,
  label,
  entityLabel,
  inputType,
  autoComplete,
  configured,
  stagedClear,
  onStageClear,
  onUndoClear,
  onTypedNonEmpty,
}: CredentialSecretFieldProps) {
  const placeholder = stagedClear
    ? `Will be cleared to empty on save — type to set a new ${entityLabel}`
    : configured
      ? `Configured (hidden) — leave blank to keep, or enter new ${entityLabel}`
      : `Empty — leave blank to keep empty, or enter ${entityLabel}`;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between gap-2">
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              {stagedClear ? (
                <>
                  <Badge variant="destructive">Will be cleared on save</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    aria-label={`Undo clear ${label}`}
                    onClick={onUndoClear}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Undo
                  </Button>
                </>
              ) : configured ? (
                <>
                  <Badge variant="secondary">Configured</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    aria-label={`Clear ${label}`}
                    onClick={onStageClear}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </>
              ) : (
                <Badge variant="outline">Empty</Badge>
              )}
            </div>
          </div>
          <FormControl>
            <Input
              type={inputType}
              autoComplete={autoComplete}
              placeholder={placeholder}
              {...field}
              onChange={(e) => {
                if (stagedClear && e.target.value.trim().length > 0) {
                  onTypedNonEmpty();
                }
                field.onChange(e);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PhilHealthTab({
  clinicUid,
  clinicSetting,
}: {
  clinicUid: string;
  clinicSetting: ClinicSettingData | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clearUsername, setClearUsername] = useState(false);
  const [clearPassword, setClearPassword] = useState(false);
  const [savedFlags, setSavedFlags] = useState<{
    clinicUid: string;
    username: boolean;
    password: boolean;
  } | null>(null);

  const hasUsername =
    savedFlags?.clinicUid === clinicUid
      ? savedFlags.username
      : (clinicSetting?.hasPhilhealthYakapUsername ?? false);
  const hasPassword =
    savedFlags?.clinicUid === clinicUid
      ? savedFlags.password
      : (clinicSetting?.hasPhilhealthYakapPassword ?? false);

  const form = useForm<PhilHealthFormValues>({
    resolver: zodResolver(philhealthSchema),
    defaultValues: {
      philhealthAccreditationNumber:
        clinicSetting?.philhealthAccreditationNumber ?? "",
      facilityName: clinicSetting?.facilityName ?? "",
      philhealthYakapUsername: "",
      philhealthYakapPassword: "",
      philhealthYakapPmccNumber:
        clinicSetting?.philhealthYakapPmccNumber ?? "",
    },
  });

  const onSubmit = (values: PhilHealthFormValues) => {
    startTransition(async () => {
      const result = await updatePhilHealthSettingsAction(clinicUid, {
        philhealthAccreditationNumber:
          values.philhealthAccreditationNumber || undefined,
        facilityName: values.facilityName || undefined,
        philhealthYakapUsername: buildCredentialPayload(
          values.philhealthYakapUsername,
          clearUsername,
          true,
        ),
        philhealthYakapPassword: buildCredentialPayload(
          values.philhealthYakapPassword,
          clearPassword,
          false,
        ),
        philhealthYakapPmccNumber:
          values.philhealthYakapPmccNumber || undefined,
      });

      if (result.status) {
        setSavedFlags({
          clinicUid,
          username: result.data?.hasPhilhealthYakapUsername ?? false,
          password: result.data?.hasPhilhealthYakapPassword ?? false,
        });
        setClearUsername(false);
        setClearPassword(false);
        form.reset({
          philhealthAccreditationNumber:
            result.data?.philhealthAccreditationNumber ??
            values.philhealthAccreditationNumber ??
            "",
          facilityName:
            result.data?.facilityName ?? values.facilityName ?? "",
          philhealthYakapUsername: "",
          philhealthYakapPassword: "",
          philhealthYakapPmccNumber:
            result.data?.philhealthYakapPmccNumber ??
            values.philhealthYakapPmccNumber ??
            "",
        });
        router.refresh();
        toast.success("PhilHealth settings saved.");
      } else {
        toast.error(result.message ?? "Failed to save PhilHealth settings.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              PhilHealth &amp; Facility Details
            </CardTitle>
            <CardDescription>
              Required for generating PhilHealth EKAS authorizations and
              official documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="facilityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. City Medical Center" {...field} />
                  </FormControl>
                  <FormDescription>
                    Official facility name as registered with PhilHealth.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="philhealthAccreditationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilHealth Accreditation Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. PHA-000000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Printed on all PhilHealth-related documents issued by this
                    clinic.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CredentialSecretField
              control={form.control}
              name="philhealthYakapUsername"
              label="PhilHealth Yakap Username"
              entityLabel="username"
              inputType="text"
              autoComplete="off"
              configured={hasUsername}
              stagedClear={clearUsername}
              onStageClear={() => {
                setClearUsername(true);
                form.setValue("philhealthYakapUsername", "");
              }}
              onUndoClear={() => setClearUsername(false)}
              onTypedNonEmpty={() => setClearUsername(false)}
            />

            <CredentialSecretField
              control={form.control}
              name="philhealthYakapPassword"
              label="PhilHealth Yakap Password"
              entityLabel="password"
              inputType="password"
              autoComplete="new-password"
              configured={hasPassword}
              stagedClear={clearPassword}
              onStageClear={() => {
                setClearPassword(true);
                form.setValue("philhealthYakapPassword", "");
              }}
              onUndoClear={() => setClearPassword(false)}
              onTypedNonEmpty={() => setClearPassword(false)}
            />

            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              <span>
                Stored Yakap credentials cannot be viewed after saving. Leave
                either field blank to keep its current value, or click{" "}
                <strong>Clear</strong> and save to replace it with an empty
                string (&quot;&quot;) per PhilHealth guidelines.
              </span>
            </div>

            <FormField
              control={form.control}
              name="philhealthYakapPmccNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilHealth PMCC Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Z15445" {...field} />
                  </FormControl>
                  <FormDescription>
                    PMCC Number required for Yakap Integration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
