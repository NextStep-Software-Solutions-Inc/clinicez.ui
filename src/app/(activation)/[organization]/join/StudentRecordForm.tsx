import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAtom } from "jotai";
import { additionalInfoValidAtom } from "./AdditionalInformationStep";
import { useOrgYearLevels } from "@hooks/useOrgYearLevel";
import { useStudentLevels } from "@hooks/useStudentLevel";
import { useOrgPrograms } from "@hooks/useOrgProgram";
import { useOrgColleges } from "@hooks/useOrgCollege";
import { useOrgDepartments } from "@hooks/useOrgDepartment";
import { toast } from "sonner";
import { upsertStudentRecordAction } from "@actions/student-record.action";
import { useUser } from "@hooks/useUser";
import { joinOrgApplicationAtom } from "@state/join-org-application";


const employeeRecordSchema = z.object({
  studentId: z.string({
    required_error: "Student ID is required"
  }).min(1, {
    message: "Minimum of 1 character"
  }),
  lrn: z.string({
    message: "Learner Ref. Number must be a string"
  }).optional(),
  levelId: z.coerce.number({
    required_error: "School level is required"
  }),
  yearLevelId: z.coerce.number({
    required_error: "Year level/Grade is required"
  }),
  programId: z.coerce.number({
    required_error: "Program/Strand is required"
  }),
  isCollege : z.boolean().optional().default(false),
  collegeId: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
})

export type StudentRecordType = z.infer<typeof employeeRecordSchema>;

export default function StudentRecordForm({orgId, userId} : {orgId: string, userId: string}) {

  const [additionalInfoValid, setAdditionalInfoValid] = useAtom(additionalInfoValidAtom)
  const [orgApplication, setOrgApplication] = useAtom(joinOrgApplicationAtom)
  const {data: orgYearLevels} = useOrgYearLevels(orgId)
  const {data: studentLevels} = useStudentLevels()
  const {data: orgPrograms} = useOrgPrograms(orgId)
  const {data: orgColleges} = useOrgColleges(orgId)
  const {data: orgDepartment} = useOrgDepartments(orgId)
  const {data: user} = useUser({userId})

  const form = useForm<StudentRecordType>({
    resolver: zodResolver(employeeRecordSchema),
    mode: "all",
    defaultValues: {
      ...orgApplication.student_record
    }
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      const orgUid = orgApplication.orgId
      if(!user?.data) {
        toast.error("User data not found")
        return;
      }
      if(!orgUid) {
        toast.error("Organization ID not found")
        return;
      }
      const userId = user.data.id

      toast.promise(upsertStudentRecordAction({...values, orgUid, userId}), {
        loading: "Saving student record...",
        success: async (res) => {
          if(!res.success) {
            return `An error occurred: ${res?.message}`
          }
          setAdditionalInfoValid((prev) => ({
            ...prev,
            student_record: true
          }))
          setOrgApplication(prev => ({
            ...prev,
            student_record: values
          }))
          return res.message
        },
        error: (error) => `An error occurred: Error ${error}`
      })
      
    })()
  }

  return (
    <Form {...form}>
      <form action={action} className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-start">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow md:flex-grow-0">
                  <FormLabel htmlFor="studentId">Student ID</FormLabel>
                  <FormControl>
                    <Input id="studentId" {...field} />
                  </FormControl>
                  <FormDescription>Enter your student ID</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="lrn"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow md:flex-grow-0">
                  <FormLabel htmlFor="lrn">Learner Ref. Number (if applicable)</FormLabel>
                  <FormControl>
                    <Input id="lrn" {...field} />
                  </FormControl>
                  <FormDescription>Enter your learner reference number</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="levelId"
            render={({ field }) => {
              return (
                <FormItem className="">
                  <FormLabel htmlFor="levelId">Student Level</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={studentLevels ?? []}
                          render={(level) => (
                            <SelectItem key={level.id} value={level.id.toString()}>{level.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select your current student level</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
        </div>

       

        <div className="flex flex-wrap gap-2 items-start">
          <FormField
            control={form.control}
            name="yearLevelId"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow">
                  <FormLabel htmlFor="yearLevelId">Year/Grade Level</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a year/grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={orgYearLevels ?? []}
                          render={(college) => (
                            <SelectItem key={college.id} value={college.id.toString()}>{college.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select your current year/grade level</FormDescription>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="programId"
            render={({ field }) => {
              return (
                <FormItem className="flex-grow">
                  <FormLabel htmlFor="programId">Program</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Each
                          of={orgPrograms ?? []}
                          render={(program) => (
                            <SelectItem key={program.id} value={program.id.toString()}>{program.name}</SelectItem>
                          ) }
                        />
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Select the progmam that you belong.</FormDescription>
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
                  >I am a college student.</FormLabel>
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
                          of={orgDepartment ?? []}
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
        </ConditionalRender>
        <ConditionalRender condition={form.formState.isDirty || !additionalInfoValid.student_record}>
          <ActionButton disabled={form.formState.isLoading || !form.formState.isValid} className="mt-10">Save</ActionButton>
        </ConditionalRender>
      </form>
    </Form>
  );
}
