import {
  Card,
  CardContent, CardHeader,
  CardTitle
} from "@components/ui/card";
import { CircleDashed, CircleOff, Files, LucideIcon, User, UserCheck, Users, UserXIcon } from "lucide-react";
import ConditionalRender from "@components/utils/ConditionalRender";
import { isOrgMember, isOrgAdmin } from "@lib/org-utils";
import { getDashboardData } from "@actions/dashboard/overview.actions";
import Link from "next/link";
import Each from "@components/utils/Each";
// import MyMemberships from "./components/MyMemberships";

interface DashboardStatsProps {
  userId: string;
  orgUid: string;
}

export const DashboardStats = async ({ userId, orgUid }: DashboardStatsProps) => {
  const [stats, member, orgAdmin] = await Promise.all([
    getDashboardData(orgUid),
    isOrgMember(),
    isOrgAdmin(orgUid)
  ]);

  const { files, memberships, members, roles } = stats;

  const UserOrganizationStatus = {
    ACTIVE: "ACTIVE",
    PENDING: "PENDING",
    SUSPENDED: "SUSPENDED",
    INACTIVE: "INACTIVE"
  }

  const membershipIcons = {
    ACTIVE: UserCheck,
    PENDING: CircleDashed,
    SUSPENDED: CircleOff,
    INACTIVE: UserXIcon
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
      <ConditionalRender condition={member || orgAdmin}>
        <div>
          <h3 className="text-lg font-medium mb-2 ml-1">Organization Overview</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href={`/organizations/${orgUid}/membership`} >

              <DashboardTile
                title={`Membership`}
                icon={User}
                value={`${membershipSum}`}
                description={`${pendingCount} Pending applications`}
              />
              
            </Link>
            <DashboardTile
              title={`Absolute Members`}
              icon={Users}
              value={`${members}`}  
              description={`Total members`}
            />
            
            <DashboardTile
              title={`Uploaded Documents`}
              icon={Files}
              value={`${files._count}`}
              description={`${((files?._sum?.size ?? 0) * 0.000001).toFixed(2)} MB total used`}
            />
          </div>
        </div>
      </ConditionalRender>
      <ConditionalRender condition={member || orgAdmin}>
        <div>
          <h3 className="text-lg font-medium mb-2 ml-1">Membership Statuses</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Each
              of={membershipStatuses}
              render={(status) => {
                const Icon = membershipIcons[status.status as keyof typeof UserOrganizationStatus];
                return (
                  <DashboardTile
                    key={status.status}
                    title={`${status.status.toLowerCase()} Membership`}
                    icon={Icon}
                    value={`${status._count}`}
                    description={`Out of ${membershipSum} membership`}
                  />
                )
              }}
            />
          </div>
        </div>
      </ConditionalRender>
      <ConditionalRender condition={member || orgAdmin}>
        <div>
          <h3 className="text-lg font-medium mb-2 ml-1">Organization Roles</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Each
              of={roles}
              render={(role) => {
                return (
                  <DashboardTile
                    key={role.id}
                    title={role.name}
                    icon={Users}
                    value={`${role._count.OrganizationMembers}`}
                    description={`Out of ${membershipSum} membership`}
                  />
                )
              }}
            />
          </div>
        </div>
      </ConditionalRender>
    </>
  );
};

interface DashboardTileProps {
  title: string;
  icon: React.ElementType;
  value: string;
  description: string;

}
export const DashboardTile = ({title, icon: Icon, value, description}: DashboardTileProps) => {
  return (
    <Card className="group/icon hover:ring-1">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">{title}</CardTitle>
        <Icon className="text-primary group-hover/icon:scale-150 transition-all" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}