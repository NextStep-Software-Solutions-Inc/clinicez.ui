"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  getPhysicalExaminationAction,
  savePhysicalExaminationAction,
} from "@/actions/phr/physical-examination.action";

const physicalExaminationSchema = z.object({
  visualAcuityLeft: z.string().optional(),
  visualAcuityRight: z.string().optional(),
  status: z.string().optional(),
});

type PhysicalExaminationFormValues = z.infer<typeof physicalExaminationSchema>;

interface PhysicalExaminationClientProps {
  userId: string;
}

export default function PhysicalExaminationClient({
  userId,
}: PhysicalExaminationClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<PhysicalExaminationFormValues>({
    resolver: zodResolver(physicalExaminationSchema),
    defaultValues: {
      visualAcuityLeft: "",
      visualAcuityRight: "",
      status: "",
    },
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getPhysicalExaminationAction(userId);

      if (result.status && result.data) {
        form.reset({
          visualAcuityLeft: result.data.visualAcuityLeft || "",
          visualAcuityRight: result.data.visualAcuityRight || "",
          status: result.data.status || "",
        });
      }
    } catch (error) {
      console.error("Error loading physical examination:", error);
      toast.error(getActionErrorMessage(error, "Failed to load physical examination data"));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PhysicalExaminationFormValues) => {
    try {
      setSaving(true);
      const result = await savePhysicalExaminationAction(userId, data);

      if (result.status) {
        toast.success(result.message || "Physical examination saved successfully");
      } else {
        toast.error(result.message || "Failed to save physical examination");
      }
    } catch (error) {
      console.error("Error saving physical examination:", error);
      toast.error(getActionErrorMessage(error, "Failed to save physical examination"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Physical Examination</h3>
        <p className="text-sm text-muted-foreground">
          Record visual acuity and physical examination results.
        </p>
      </div>
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Acuity</CardTitle>
              <CardDescription>
                Record the patient&apos;s visual acuity for each eye (e.g., 20/20, 20/40)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="visualAcuityLeft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Left Eye Visual Acuity</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 20/20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Visual acuity measurement for left eye
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visualAcuityRight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Right Eye Visual Acuity</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 20/20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Visual acuity measurement for right eye
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Physical Status</CardTitle>
              <CardDescription>
                Overall physical examination status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select physical status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Physically Fit">Physically Fit</SelectItem>
                        <SelectItem value="Underweight">Underweight</SelectItem>
                        <SelectItem value="Normal Weight">Normal Weight</SelectItem>
                        <SelectItem value="Overweight">Overweight</SelectItem>
                        <SelectItem value="Obese">Obese</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Overall physical examination assessment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Physical Examination
          </Button>
        </form>
      </Form>
    </div>
  );
}
