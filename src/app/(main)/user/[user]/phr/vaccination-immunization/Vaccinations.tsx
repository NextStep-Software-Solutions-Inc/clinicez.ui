"use server";

import { getUserVaccinationsAction } from "@actions/user-vaccination.action";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import VaxItem from "./VaxItem";
import AddUserVaccination from "./modal/AddUserVaccinationModal";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
interface VaccinationProps {
  userId: string;
}

export type UserVaccinationType = Awaited<ReturnType<typeof getUserVaccinationsAction>>[number];

export default async function Vaccinations({userId}: VaccinationProps) {

  const userVax = await getUserVaccinationsAction(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">Recent Vaccinations <Badge className="ml-2">{userVax.length}</Badge></span>
          <AddUserVaccination/>
        </CardTitle>
        <Separator/>
      </CardHeader>
      <CardContent className="space-y-2">
        <Each
          of={userVax}
          render={(vaccination) => <VaxItem key={vaccination.id} vaccination={vaccination}/>}
        />
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
};

