export interface OrgClinicSetting {
  isPublic: boolean;
  sendEmailNotification: boolean | null;
}

export interface OrgClinicDetail {
  id: number;
  clinicUid: string;
  name: string;
  description: string | null;
  logo: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  memberCount: number;
  activeMemberCount: number;
  patientCount: number;
  appointmentCount: number;
  setting: OrgClinicSetting | null;
}

export interface OrgClinicsMetrics {
  totalClinics: number;
  activeClinics: number;
  inactiveClinics: number;
  totalMembers: number;
  totalPatients: number;
  totalAppointments: number;
}

export interface OrgClinicsData {
  clinics: OrgClinicDetail[];
  metrics: OrgClinicsMetrics;
}
