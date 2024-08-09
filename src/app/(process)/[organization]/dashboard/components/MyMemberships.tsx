"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { useUserOrganizations } from "@hooks/useUserOrganization";
import { Building2, Files } from "lucide-react"

interface MyMembershipsProps {
  userId: string;
}
export default function MyMemberships({ userId }: MyMembershipsProps) { 

  const {data: myOrganizations } = useUserOrganizations({userId})
  return (
    <div>
      <h3 className="text-lg font-medium mb-2 ml-1">My Memberships</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group/icon hover:ring-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                Joined Organizations
            </CardTitle>
            <Building2 className="text-primary group-hover/icon:scale-150 transition-all" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myOrganizations?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {!!myOrganizations && `Recently joined ${myOrganizations[myOrganizations.length -1].Organization.name}`} 
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
            <div className="text-2xl font-bold">{0}</div>
            <p className="text-xs text-muted-foreground">
              {((0) * 0.000001).toFixed(2)} MB total used
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}