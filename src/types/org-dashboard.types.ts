export interface OrgDashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  suspendedMembers: number;
  totalClinics: number;
  totalRoles: number;
  totalDepartments: number;
  totalColleges: number;
  totalPrograms: number;
  totalOffices: number;
}

export interface OrgMemberActivity {
  id: number;
  name: string;
  roleName: string;
  status: string;
  joinedAt: Date;
  picture?: string | null;
}

export interface OrgClinicItem {
  clinicUid: string;
  name: string;
  logo?: string | null;
}

export interface OrgRoleBreakdown {
  id: number;
  name: string;
  memberCount: number;
}

export interface OrgDashboardData {
  organization: {
    id: number;
    orgUid: string;
    name: string;
    description?: string | null;
    logo?: string | null;
    email?: string | null;
    isActive: boolean;
    createdAt: Date;
    setting?: {
      isPublic: boolean;
      sendEmailNotification: boolean;
      emailToOrgOnly: boolean;
    } | null;
  };
  metrics: OrgDashboardMetrics;
  recentMembers: OrgMemberActivity[];
  clinics: OrgClinicItem[];
  roleBreakdown: OrgRoleBreakdown[];
}
