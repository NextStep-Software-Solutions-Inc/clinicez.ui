import {
  Card,
  CardContent, CardHeader,
  CardTitle
} from "@components/ui/card";
import { CircleDashed, CircleOff, Files, User, UserCheck, Users, UserXIcon } from "lucide-react";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isMember, isOrgAdmin } from "@lib/protect-org";
import { getDashboardData } from "@actions/dashboard/overview.actions";
import { UserOrganizationStatus } from "@prisma/common/client";
import Link from "next/link";
import Each from "@components/utils/Each";
// import MyMemberships from "./components/MyMemberships";

interface DashboardStatsProps {
  userId: string;
  orgId: string;
}

export const DashboardStats = async ({ userId, orgId }: DashboardStatsProps) => {
  const [stats, member, orgAdmin] = await Promise.all([
    getDashboardData(orgId),
    isMember(),
    isOrgAdmin()
  ]);

  const { files, memberships, members, roles } = stats;

  const membershipIcons = {
    [UserOrganizationStatus.ACTIVE]: UserCheck,
    [UserOrganizationStatus.PENDING]: CircleDashed,
    [UserOrganizationStatus.SUSPENDED]: CircleOff,
    [UserOrganizationStatus.INACTIVE]: UserXIcon
  }

  const membershipStatuses = Object.values(UserOrganizationStatus).map(status => ({
    status,
    _count: memberships.find(m => m.status === status)?._count.status ?? 0
  }));
  const pendingCount = memberships.find(m => m.status === UserOrganizationStatus.PENDING)?._count.status || 0;
  const membershipSum = memberships.reduce((acc, m) => acc + m._count._all, 0);


  return (
    <>
      {/* <ConditionalRender condition>
        <MyMemberships userId={userId}/>
      </ConditionalRender> */}
      <ConditionalRender condition={member && orgAdmin}>
        <div>
          <h3 className="text-lg font-medium mb-2 ml-1">Organization Overview</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href={`/${orgId}/membership`}>
              <Card className="group/icon hover:ring-1">
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
              </Card>
            </Link>
            <Card className="group/icon hover:ring-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
              Absolute Members
                </CardTitle>
                <Users className="text-primary group-hover/icon:scale-150 transition-all" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members}</div>
                <p className="text-xs text-muted-foreground">
              Total members
                </p>
              </CardContent>
            </Card>
            <Card className="group/icon hover:ring-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
              Uploaded Documents
                </CardTitle>
                <Files className="text-primary group-hover/icon:scale-150 transition-all" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{files._count}</div>
                <p className="text-xs text-muted-foreground">
                  {((files?._sum?.size ?? 0) * 0.000001).toFixed(2)} MB total used
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ConditionalRender>
      <ConditionalRender condition={member && orgAdmin}>
        <div>
          <h3 className="text-lg font-medium mb-2 ml-1">Membership Statuses</h3>
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
            <Each
              of={membershipStatuses}
              render={(status) => {
                const Icon = membershipIcons[status.status];
                return (
                  <Card key={status.status} className="group/icon hover:ring-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium capitalize">{status.status.toLowerCase()} Membership</CardTitle>
                      <Icon className="text-primary group-hover/icon:scale-150 transition-all" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{status._count}</div>
                      <p className="text-xs text-muted-foreground">
                      Out of {membershipSum} membership
                      </p>
                    </CardContent>
                  </Card>
                )
              }}
            />
          </div>
        </div>
      </ConditionalRender>
      <ConditionalRender condition={member && orgAdmin}>
        <div>
          <h3 className="text-lg font-medium mb-2 ml-1">Organization Roles</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Each
              of={roles}
              render={(role, index) => {
                return (
                  <Card key={role.id} className="group/icon hover:ring-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{role.name}</CardTitle>
                      <Users className="text-primary group-hover/icon:scale-150 transition-all" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{role._count.UserOrganizations}</div>
                      <p className="text-xs text-muted-foreground">
                      Out of {membershipSum} membership
                      </p>
                    </CardContent>
                  </Card>
                )
              }}
            />
          </div>
        </div>
      </ConditionalRender>
    </>
  );
};
