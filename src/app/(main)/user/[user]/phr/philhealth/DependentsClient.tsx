"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { createPhilHealthDependentAction, updatePhilHealthDependentAction, deletePhilHealthDependentAction } from "@/actions/philhealth/philhealth-dependent.action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { getMaxDate } from "@/lib/day-utils";

const RELATIONSHIP_OPTIONS = ["Spouse", "Child", "Foster Child", "Parent", "Parent-In-Law"] as const;
const SUFFIX_OPTIONS = ["Jr.", "Sr.", "II", "III", "IV"] as const;

const dependentSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.enum(SUFFIX_OPTIONS).optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
  relationship: z.enum(RELATIONSHIP_OPTIONS).optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional().or(z.literal("")).transform(v => v === "" ? undefined : v),
});

type DependentFormValues = z.infer<typeof dependentSchema>;

interface DependentUIModel extends DependentFormValues { id: number; editing?: boolean; }

// Runtime mapper to enforce shape without 'any'
function mapServerDependentToUI(data: unknown): DependentUIModel | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const id = typeof d.id === "number" ? d.id : null;
  const firstName = typeof d.firstName === "string" ? d.firstName : "";
  if (id === null || !firstName) return null;
  const getOptStr = (k: string) => (typeof d[k] === "string" ? d[k] as string : undefined);
  const suffix = getOptStr("suffix");
  const relationship = getOptStr("relationship");
  let dob: string | undefined;
  if (d.dob instanceof Date) dob = d.dob.toISOString().slice(0, 10);
  else if (typeof d.dob === "string" && /\d{4}-\d{2}-\d{2}/.test(d.dob)) dob = d.dob;
  const gender = getOptStr("gender") as DependentFormValues["gender"] | undefined;
  return {
    id,
    firstName,
    middleName: getOptStr("middleName"),
    lastName: getOptStr("lastName"),
    suffix: suffix as DependentFormValues["suffix"],
    relationship: relationship as DependentFormValues["relationship"],
    dob,
    gender,
    editing: false
  };
}

interface DependentsClientProps {
  userUid: string;
  readonly: boolean;
  initialDependents: DependentUIModel[];
}

export default function DependentsClient({ userUid, readonly, initialDependents }: DependentsClientProps) {
  const [dependents, setDependents] = useState<DependentUIModel[]>(initialDependents.map(d => ({ ...d, editing: false })));
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const newForm = useForm<DependentFormValues>({ resolver: zodResolver(dependentSchema), defaultValues: { firstName: "" } });

  const handleAdd = () => { setAdding(true); };
  const handleCancelAdd = () => { setAdding(false); newForm.reset(); };

  const submitNew = newForm.handleSubmit(values => {
    toast.promise(promiseWrapper(createPhilHealthDependentAction)({ userUid, dependent: values }), {
      loading: "Saving dependent...",
      success: res => {
        const mapped = mapServerDependentToUI(res.data);
        if (mapped) setDependents(prev => [...prev, mapped]);
        setAdding(false); newForm.reset(); return res.message;
      },
      error: e => e
    });
  });

  const toggleEdit = (id: number, edit: boolean) => {
    setDependents(prev => prev.map(d => d.id === id ? { ...d, editing: edit } : d));
  };

  const updateDependent = (id: number, updated: DependentFormValues) => {
    setUpdatingId(id);
    toast.promise(promiseWrapper(updatePhilHealthDependentAction)({ userUid, dependentId: id, dependent: updated }), {
      loading: "Updating dependent...",
      success: res => {
        const mapped = mapServerDependentToUI(res.data);
        if (mapped) setDependents(prev => prev.map(d => d.id === id ? mapped : d));
        return res.message;
      },
      error: e => e,
      finally: () => setUpdatingId(null)
    });
  };

  const deleteDependent = (id: number) => {
    setDeletingId(id);
    toast.promise(promiseWrapper(deletePhilHealthDependentAction)({ userUid, dependentId: id }), {
      loading: "Deleting dependent...",
      success: res => {
        setDependents(prev => prev.filter(d => d.id !== id));
        return res.message;
      },
      error: e => e,
      finally: () => setDeletingId(null)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium">Dependents</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">List qualified dependents (spouse, children, foster children, or parents/in-laws) associated with this PhilHealth member record.</p>
        </div>
        <Button size="sm" disabled={readonly || adding} onClick={handleAdd}>Add Dependent</Button>
      </div>
      {adding && (
        <Form {...newForm}>
          <form onSubmit={submitNew} className="grid gap-2 md:grid-cols-8 p-3 border rounded-md bg-muted/30">
            {/* Row 1: first, middle, last, suffix */}
            <FormField control={newForm.control} name="firstName" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>First Name</FormLabel>
                <FormControl><Input placeholder="Juan" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={newForm.control} name="middleName" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Middle Name</FormLabel>
                <FormControl><Input placeholder="Santos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={newForm.control} name="lastName" render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Last Name</FormLabel>
                <FormControl><Input placeholder="Dela Cruz" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={newForm.control} name="suffix" render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel>Suffix</FormLabel>
                <Select onValueChange={val => field.onChange(val)} defaultValue={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Suffix" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUFFIX_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {/* Row 2: relationship, birthdate (spans remaining) */}
            <FormField control={newForm.control} name="relationship" render={({ field }) => (
              <FormItem className="md:col-span-4">
                <FormLabel>Relationship</FormLabel>
                <Select onValueChange={val => field.onChange(val)} defaultValue={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={newForm.control} name="dob" render={({ field }) => (
              <FormItem className="md:col-span-4">
                <FormLabel>Birthdate</FormLabel>
                <FormControl>
                  <Input
                    type="date" {...field}
                    max={getMaxDate()}
                  />
                </FormControl>
                <FormDescription className="sr-only">Date of birth</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="col-span-full flex gap-2 pt-2">
              <Button type="submit" size="sm" disabled={newForm.formState.isSubmitting}>Save</Button>
              <Button type="button" variant="outline" size="sm" disabled={newForm.formState.isSubmitting} onClick={handleCancelAdd}>Cancel</Button>
            </div>
          </form>
        </Form>
      )}
      <div className="space-y-3">
        {dependents.map(dep => (
          <DependentRow
            key={dep.id}
            dep={dep}
            readonly={readonly}
            onToggleEdit={toggleEdit}
            onUpdate={updateDependent}
            onDelete={deleteDependent}
            deletingId={deletingId}
            updatingId={updatingId}
          />
        ))}
        {!dependents.length && !adding && (
          <p className="text-xs text-muted-foreground">No dependents added.</p>
        )}
      </div>
    </div>
  );
}

interface DependentRowProps {
  dep: DependentUIModel;
  readonly: boolean;
  onToggleEdit: (id: number, edit: boolean) => void;
  onUpdate: (id: number, values: DependentFormValues) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
  updatingId: number | null;
}

function DependentRow({ dep, readonly, onToggleEdit, onUpdate, onDelete, deletingId, updatingId }: DependentRowProps) {
  const form = useForm<DependentFormValues>({ resolver: zodResolver(dependentSchema), defaultValues: dep });
  const submit = form.handleSubmit(values => onUpdate(dep.id, values));
  const editing = dep.editing && !readonly;
  const isUpdating = (editing && form.formState.isSubmitting) || updatingId === dep.id;
  return (
    <Form {...form}>
      <form onSubmit={submit} className="grid gap-2 md:grid-cols-8 p-3 border rounded-md">
        {/* Row 1: first, middle, last, suffix */}
        <FormField control={form.control} name="firstName" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>First</FormLabel>
            <FormControl><Input placeholder="Juan" disabled={!editing} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="middleName" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Middle</FormLabel>
            <FormControl><Input placeholder="S." disabled={!editing} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="lastName" render={({ field }) => (
          <FormItem className="md:col-span-3">
            <FormLabel>Last</FormLabel>
            <FormControl><Input placeholder="Dela Cruz" disabled={!editing} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="suffix" render={({ field }) => (
          <FormItem className="md:col-span-1">
            <FormLabel>Suffix</FormLabel>
            <Select disabled={!editing} onValueChange={val => field.onChange(val)} defaultValue={field.value ?? ""}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Suffix" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {SUFFIX_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        {/* Row 2: relationship + birthdate */}
        <FormField control={form.control} name="relationship" render={({ field }) => (
          <FormItem className="md:col-span-4">
            <FormLabel>Relationship</FormLabel>
            <Select disabled={!editing} onValueChange={val => field.onChange(val)} defaultValue={field.value ?? ""}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="dob" render={({ field }) => (
          <FormItem className="md:col-span-4">
            <FormLabel>Birthdate</FormLabel>
            <FormControl><Input type="date" disabled={!editing} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="col-span-full flex gap-2 pt-2">
          {!editing && !readonly && (
            <>
              <Button type="button" size="sm" variant="outline" disabled={isUpdating} onClick={() => onToggleEdit(dep.id, true)}>Edit</Button>
              <Button type="button" size="sm" variant="destructive" disabled={deletingId === dep.id} onClick={() => onDelete(dep.id)}>Delete</Button>
            </>
          )}
          {editing && (
            <>
              <Button type="submit" size="sm" disabled={form.formState.isLoading}>Save</Button>
              <Button type="button" size="sm" variant="outline" disabled={isUpdating} onClick={() => { onToggleEdit(dep.id, false); form.reset(dep); }}>Cancel</Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
