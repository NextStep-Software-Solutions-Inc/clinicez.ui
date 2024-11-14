import EMRPreviewSheet from "@components/EMRPreviewSheet";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ConditionalRender from "@components/utils/ConditionalRender";
import { differenceInCalendarYears } from "date-fns";
import { PatientsType } from "./PatientList";
import Image from "next/image";
import { GetClinicPatients } from "@/actions/clinics/clinic-patient.action";

interface PatientCardProps {
    patient: NonNullable<GetClinicPatients["data"]>[number] & {
      immunocompromised?: boolean
    }
}
export const PatientCard = async ({patient}: PatientCardProps) => {
  const { Patient: {dob, gender, firstName, middleName, lastName, suffix, updatedAt, bloodType, picture = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png", nickname, userId}, immunocompromised} = patient

  const nameInitials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`
  const name = `${lastName || "-"}, ${firstName || "-"} ${middleName ?? ""} ${suffix ?? ""}`
  return (
    <Card className="shadow-2xl select-none flex-grow lg:flex-grow-0 basis-[35rem]">
      <CardHeader>
        <CardTitle className="line-clamp-1">{name}</CardTitle>
        <CardDescription>
        Last update: {new Date(updatedAt).toLocaleDateString("en-PH", {
            month:"short",
            day:"numeric",
            year:"numeric",
            hour:"numeric",
            minute:"numeric",
            timeZone: "Asia/Manila"
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Avatar className="rounded w-40 h-40">
            {
              picture ? 
                (<Image width={200} height={200} className="object-cover w-full" src={picture} alt={nickname ?? ""} />)
                : <AvatarFallback>{nameInitials}</AvatarFallback>
            }
            
          </Avatar>
          <div className="flex-1 flex flex-col justify-between">
            <div className="">
              <p className="text-sm text-muted-foreground italic font-medium truncate overflow-hidden capitalize">{gender?.toLowerCase()} / {dob && `${differenceInCalendarYears(new Date(), dob)} years old`}</p>
              <p className="text-sm text-muted-foreground italic font-medium capitalize">{bloodType?.split("_").join(" ").toLowerCase()}</p>
              {/* <Badge variant="default" className="capitalize">{patient.OrganizationMembers[0].status.toLowerCase()}</Badge> */}
            </div>
            <div className="flex gap-2 flex-wrap">
              <ConditionalRender condition={immunocompromised ?? false}>
                <Badge variant="destructive">Immunocompromised</Badge>
              </ConditionalRender>
            </div>
            <div>
              <EMRPreviewSheet record={{ id: userId, subject: name }}>
                <Button size="sm" variant="link">Preview EMR</Button>
              </EMRPreviewSheet>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
}