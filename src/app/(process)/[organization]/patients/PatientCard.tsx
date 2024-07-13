import EMRPreviewSheet from "@components/EMRPreviewSheet";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ConditionalRender from "@components/utils/ConditionalRender";
import { differenceInCalendarYears, format } from "date-fns";
import { PatientsType } from "./PatientList";

interface PatientCardProps {
    patient: PatientsType[number] & {
      immunocompromised?: boolean;
    }
}
export const PatientCard = async ({patient}: PatientCardProps) => {
  const { dob, gender, immunocompromised} = patient

  const nameInitials = `${patient.firstName?.charAt(0) ?? ""}${patient.lastName?.charAt(0) ?? ""}`
  const name = `${patient.lastName || "-"}, ${patient.firstName || "-"} ${patient.middleName ?? ""} ${patient.suffix ?? ""}`
  const picture = patient.picture || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
  return (
    <Card className="shadow-2xl select-none flex-grow lg:flex-grow-0 basis-[35rem]">
      <CardHeader>
        <CardTitle className="line-clamp-2">{name}</CardTitle>
        <CardDescription>
        Last update: {new Date(patient.updatedAt).toLocaleDateString("en-PH", {
            month:"short",
            day:"numeric",
            year:"numeric",
            hour:"numeric",
            minute:"numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Avatar className="rounded w-40 h-40">
            <AvatarImage className="object-cover" src={picture}alt="John Doe" />
            <AvatarFallback>{nameInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col justify-between">
            <div className="">
              <p className="text-sm text-muted-foreground italic font-medium truncate overflow-hidden capitalize">{gender?.toLowerCase()} / {dob && `${differenceInCalendarYears(new Date(), dob)} years old`}</p>
              <p className="text-sm text-muted-foreground italic font-medium capitalize">{patient.bloodType?.split("_").join(" ").toLowerCase()}</p>
              <Badge variant="default" className="capitalize">{patient.Organizations[0].status.toLowerCase()}</Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ConditionalRender condition={immunocompromised ?? false}>
                <Badge variant="destructive">Immunocompromised</Badge>
              </ConditionalRender>
            </div>
            <div>
              <EMRPreviewSheet record={{ id: patient.userId, subject: name }}>
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