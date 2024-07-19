import ActionButton from "@components/ActionButton";
import { ComboBox } from "@components/ComboBox";
import { Checkbox } from "@components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "@hooks/useLocalStorage";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OrganizationApplicationData } from "./OrganizationSteps";
import { useSetAtom } from "jotai";
import { additionalInfoValidAtom } from "./AdditionalInformationStep";
import { useOrgCollege } from "@hooks/useOrgCollege";
import { useOrgDepartment } from "@hooks/useOrgDepartment";
import { useOrgOffice } from "@hooks/useOrgOffice";


const employeeRecordSchema = z.object({
  employeeId: z.string({
    required_error: "Employee ID is required"
  }).min(1, {
    message: "Minimum of 1 character"
  }),
  position: z.string({
    required_error: "Position is required"
  }).min(1, {
    message: "Minimum of 1 character"
  }),
  designation : z.string({
    message: "What is your designation?"
  }).optional(),
  departmentId: z.coerce.number({
    required_error: "Department is required"
  }),
  officeId: z.coerce.number({
    required_error: "Office is required"
  }),
  isCollege : z.boolean().optional().default(false),
  collegeId: z.coerce.number().optional(),
})

export type EmployeeRecordType = z.infer<typeof employeeRecordSchema>;

export default function EmployeeRecordForm({orgId} : {orgId: string}) {
  const setAdditionalInfoValidAtom = useSetAtom(additionalInfoValidAtom)
  const [orgApplication, setOrgApplication] = useLocalStorage<OrganizationApplicationData>(`${orgId}_application`)
  const {data: orgColleges} = useOrgCollege(orgId)
  const {data: orgDepartments} = useOrgDepartment(orgId)
  const {data: orgOffices} = useOrgOffice(orgId)
  

  const form = useForm<EmployeeRecordType>({
    resolver: zodResolver(employeeRecordSchema),
    mode: "all",
    defaultValues: {
      ...orgApplication.employee_record
    }
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      setAdditionalInfoValidAtom((prev) => ({
        ...prev,
        employee_record: true
      }))
      form.reset(values)
      await setOrgApplication({
        employee_record: values
      })
    })()
  }

  return (
    <Form {...form}>
      <form action={action} className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-start">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow md:flex-grow-0">
                  <FormLabel htmlFor="employeeId">Employee ID</FormLabel>
                  <FormControl>
                    <Input id="employeeId" {...field} />
                  </FormControl>
                  <FormDescription>Enter your employee ID</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow md:flex-grow-0">
                  <FormLabel htmlFor="position">Position</FormLabel>
                  <FormControl>
                    <Input id="position" {...field} />
                  </FormControl>
                  <FormDescription>Enter your company position</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow md:flex-grow-0">
                  <FormLabel htmlFor="designation">Designation (optional)</FormLabel>
                  <FormControl>
                    <Input id="designation" {...field} />
                  </FormControl>
                  <FormDescription>Enter your company designation</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
        </div>

       

        <div className="flex flex-wrap gap-2 items-start">
          <FormField
            control={form.control}
            name="officeId"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow">
                  <FormLabel htmlFor="officeId">Office</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an office" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={orgOffices ?? []}
                          render={(office) => (
                            <SelectItem key={office.id} value={office.id.toString()}>{office.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the office that you belong.</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow">
                  <FormLabel htmlFor="departmentId">Department</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={orgDepartments ?? []}
                          render={(department) => (
                            <SelectItem key={department.id} value={department.id.toString()}>{department.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the department that you belong.</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="isCollege"
          render={({ field }) => {
            return (
              <FormItem className="my-5">
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                  </FormControl>
                  <FormLabel 
                    htmlFor="collegeId"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >I work in a College/University institution.</FormLabel>
                </div>
                <FormMessage/>
              </FormItem>
            )
          }}
        />
        <ConditionalRender condition={form.watch("isCollege")}>
          <FormField
            control={form.control}
            name="collegeId"
            render={({ field }) => {
              return (
                <FormItem className="">
                  <FormLabel htmlFor="collegeId">College (if applicable)</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a college" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={orgColleges ?? []}
                          render={(college) => (
                            <SelectItem key={college.id} value={college.id.toString()}>{college.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the college that you belong.</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
        </ConditionalRender>
        <ActionButton disabled={form.formState.isLoading || !form.formState.isValid} className="mt-10">Save</ActionButton>
      </form>
    </Form>
  );
}
