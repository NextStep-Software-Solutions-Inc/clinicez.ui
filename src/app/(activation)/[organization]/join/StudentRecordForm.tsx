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
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OrganizationApplicationData } from "./OrganizationSteps";


const employeeRecordSchema = z.object({
  studentId: z.string({
    required_error: "Student ID is required"
  }).min(1, {
    message: "Minimum of 1 character"
  }),
  lrn: z.string({
    required_error: "Position is required"
  }).optional(),
  level: z.coerce.number({
    required_error: "School level is required"
  }),
  yearLevel: z.coerce.number({
    required_error: "Year level is required"
  }),
  isCollege : z.boolean().optional().default(false),
  collegeId: z.coerce.number().optional(),
})

export type StudentRecordType = z.infer<typeof employeeRecordSchema>;

export default function StudentRecordForm({orgId} : {orgId: string}) {
  const [orgApplication, setOrgApplication] = useLocalStorage<OrganizationApplicationData>(`${orgId}_application`)

  const form = useForm<StudentRecordType>({
    resolver: zodResolver(employeeRecordSchema),
    mode: "all",
    defaultValues: {
      ...orgApplication.employee_record
    }
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
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
                  <FormDescription>Enter the employee ID</FormDescription>
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
                  <FormDescription>Enter your compony position</FormDescription>
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
                  <FormDescription>Enter your compony designation</FormDescription>
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
                          of={[{
                            id: 1,
                            name: "Office 1"
                          }]}
                          render={(college) => (
                            <SelectItem key={college.id} value={college.id.toString()}>{college.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the office you belong</FormDescription>
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
                          of={[{
                            id: 1,
                            name: "Department 1"
                          }]}
                          render={(college) => (
                            <SelectItem key={college.id} value={college.id.toString()}>{college.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the department you belong</FormDescription>
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
                  >Do you work in a College/University institution?</FormLabel>
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
                          of={[{
                            id: 1,
                            name: "College 1"
                          }]}
                          render={(college) => (
                            <SelectItem key={college.id} value={college.id.toString()}>{college.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the college you belong</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
        </ConditionalRender>
        <ActionButton className="mt-10">Save</ActionButton>
      </form>
    </Form>
  );
}
