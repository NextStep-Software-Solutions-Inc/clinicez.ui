export type HealthcareProvider = {
  id: number;
  User: {
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    suffix: string | null;
    gender: string | null;
  };
  HPType: {
    id: number;
    name: string;
  };
};

export type ReferralReason = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
};
