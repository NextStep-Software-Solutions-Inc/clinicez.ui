"use server";

import { getUserVaccinationsAction } from "@actions/user-vaccination.action";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import AddUserVaccination from "./modal/AddUserVaccinationModal";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { isUserOwner } from "@lib/protect-org";
import ConditionalRender from "@components/utils/ConditionalRender";
import { VaccinationForm } from "./VaccinationForm";
interface VaccinationProps {
  userId: string;
}

export type UserVaccinationType = Awaited<ReturnType<typeof getUserVaccinationsAction>>[number];

export default async function Vaccinations({userId}: VaccinationProps) {

  const [userVax, ownerUser] = await Promise.all([
    getUserVaccinationsAction(userId),
    isUserOwner(userId)
  ]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
          <span className="flex items-center">Recent Vaccinations <Badge className="ml-2">{userVax.length}</Badge></span>
          <ConditionalRender condition={ownerUser}>
            <AddUserVaccination/>
          </ConditionalRender>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <VaccinationForm vaccinations={userVax} readOnly={!ownerUser}/>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
};
