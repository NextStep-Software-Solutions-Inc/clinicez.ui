import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ConditionalRender from "@components/utils/ConditionalRender";
import Image from "next/image";
import { GetClinicPatients } from "@/actions/clinics/clinic-patient.action";
import dayjs from "@lib/day-utils";
import { ViewEMRButton } from "./ViewEMRButton";
import { calculateAge } from "@/lib/utils";

interface PatientCardProps {
    patient: NonNullable<GetClinicPatients["data"]>[number] & {
      immunocompromised?: boolean
    }
}
export const PatientCard = async ({patient}: PatientCardProps) => {
  
  const { 
    Patient: {
      dob, gender, firstName, middleName, lastName, suffix, updatedAt, bloodType, nickname, userId, picture = "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
    },
    immunocompromised
  } = patient

  const nameInitials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`
  const name = `${lastName || "-"}, ${firstName || "-"} ${middleName ?? ""} ${suffix ?? ""}`
  const age = calculateAge(dob);

  return (
    <Card className="shadow-2xl select-none flex-grow lg:flex-grow-0 basis-[35rem]">
      <CardHeader>
        <CardTitle className="line-clamp-1">{name}</CardTitle>
        <CardDescription>
          Last update: {dayjs(updatedAt).format("lll")}
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
              <p className="text-sm text-muted-foreground italic font-medium truncate overflow-hidden capitalize">{gender?.toLowerCase()} / {age && `${age} years old`}</p>
              <p className="text-sm text-muted-foreground italic font-medium capitalize">{bloodType?.split("_").join(" ").toLowerCase()}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ConditionalRender condition={immunocompromised ?? false}>
                <Badge variant="destructive">Immunocompromised</Badge>
              </ConditionalRender>
            </div>
            <div>
              <ViewEMRButton userId={userId}/>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
}

