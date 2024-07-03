import {
  Card,
  CardContent, CardHeader,
  CardTitle
} from "@components/ui/card";
import { Files, User } from "lucide-react";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isHP, isMember, isOrgAdmin } from "@lib/protect-org";
import { getDashboardData } from "@actions/dashboard.actions";
import { UserOrganizationStatus } from "@prisma/client";
import Link from "next/link";

interface DashboardStatsProps {
  userId: string;
  orgId: string;
}

type Stats = {
  files: { _count: 0; _sum: { size: 0; }; };
  memberships: {
    _count: 0;
    status: UserOrganizationStatus;
  }[];
}
export const DashboardStats = async ({ userId, orgId }: DashboardStatsProps) => {
  const [stats, member, hp, orgAdmin] = await Promise.all([await getDashboardData(userId) as Stats , isMember(), isHP(), isOrgAdmin()]);

  const { files, memberships } = stats;
  const pendingCount = memberships.find(m => m.status === UserOrganizationStatus.PENDING)?._count || 0;
  const membershipSum = memberships.reduce((acc, m) => acc + m._count, 0);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* <Card className="group/icon ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                            Appointments
                </CardTitle>
                <Calendar className="text-primary group-hover/icon:scale-150 transition-all"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                            0% from last month
                </p>
              </CardContent>
            </Card>
            <Card className="group/icon">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                            Consultations
                </CardTitle>
                <Stethoscope className="text-primary group-hover/icon:scale-150 transition-all"/>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  0% from last month
                </p>
              </CardContent>
            </Card> */}
      <ConditionalRender condition={member && (hp || orgAdmin)}>
        <Link href={`/${orgId}/membership`}>
          <Card className="group/icon">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membership</CardTitle>
              <User className="text-primary group-hover/icon:scale-150 transition-all" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membershipSum}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCount} Pending applications
              </p>
            </CardContent>
          </Card></Link>
        <Card className="group/icon">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documents
            </CardTitle>
            <Files className="text-primary group-hover/icon:scale-150 transition-all" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files._count}</div>
            <p className="text-xs text-muted-foreground">
              {(files._sum.size * 0.000001).toFixed(2)} MB total used
            </p>
          </CardContent>
        </Card>
      </ConditionalRender>
    </div>
  );
};
