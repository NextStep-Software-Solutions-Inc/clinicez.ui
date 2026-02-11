"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X } from "lucide-react";

interface PermissionsTabProps {
  permissions: {
    canViewProfile: boolean;
    canEditProfile: boolean;
    canViewHealthRecords: boolean;
    canEditHealthRecords: boolean;
    canAddHealthRecords: boolean;
    canViewConsultations: boolean;
    canViewAuditLog: boolean;
    canExportAuditLog: boolean;
    canGenerateReport: boolean;
  };
}

export default function PermissionsTab({ permissions }: PermissionsTabProps) {
  const permissionsList = [
    { name: "View Profile", value: permissions.canViewProfile, description: "Can view patient profile information" },
    { name: "Edit Profile", value: permissions.canEditProfile, description: "Can edit patient profile information" },
    { name: "View Health Records", value: permissions.canViewHealthRecords, description: "Can view patient health records" },
    { name: "Edit Health Records", value: permissions.canEditHealthRecords, description: "Can edit patient health records" },
    { name: "Add Health Records", value: permissions.canAddHealthRecords, description: "Can add new health records" },
    { name: "View Consultations", value: permissions.canViewConsultations, description: "Can view patient consultations" },
    { name: "View Audit Log", value: permissions.canViewAuditLog, description: "Can view audit trail" },
    { name: "Export Audit Log", value: permissions.canExportAuditLog, description: "Can export audit logs" },
    { name: "Generate Report", value: permissions.canGenerateReport, description: "Can generate patient reports" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Your Permissions
        </CardTitle>
        <CardDescription>
          Actions you can perform on this patient record
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {permissionsList.map((permission, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{permission.name}</p>
                  {permission.value ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Granted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Denied
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{permission.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
