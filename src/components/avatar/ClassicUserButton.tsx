"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import { User, Building2, Stethoscope, Settings, LifeBuoy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useHPs } from "@hooks/useHP";
import { useEffect, useState } from "react";
import { getMyDefaultOrganizationAction } from "@actions/organizations/organization.action";
import { getClassicDashboardLinksAction } from "@actions/dashboard/classic-dashboard-links.action";

export function ClassicUserButton() {
  const { user } = useUser();
  const router = useRouter();
  const [clinicDashboardUrl, setClinicDashboardUrl] = useState<string | null>(null);
  const [showClinicDashboard, setShowClinicDashboard] = useState(false);
  const [orgDashboardUrl, setOrgDashboardUrl] = useState<string | null>(null);
  const [showOrgDashboard, setShowOrgDashboard] = useState(false);

  const { data: hpProfiles } = useHPs({ userId: user?.id ?? "" }, !!user?.id);

  // Fetch classic dashboard links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { clinicUid, orgUid } = await getClassicDashboardLinksAction();

        if (clinicUid) {
          setShowClinicDashboard(true);
          setClinicDashboardUrl(`/clinics/${clinicUid}/dashboard`);
        }

        if (orgUid) {
          setShowOrgDashboard(true);
          setOrgDashboardUrl(`/organizations/${orgUid}/dashboard`);
        }
      } catch (error) {
        console.error("Error fetching classic dashboard links:", error);
      }
    };

    if (user?.id) {
      fetchLinks();
    }
  }, [user?.id]);

  return (
    <SignedIn>
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-10 h-10"
          }
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Action
            label="Personal Health Records"
            labelIcon={<User size={16} />}
            onClick={() => {
              if (user?.id) {
                router.push(`/user/${user.id}/phr`);
              }
            }}
          />

          {/* Clinic Dashboard - single link to first/default clinic */}
          {showClinicDashboard && clinicDashboardUrl && (
            <UserButton.Action
              label="Clinic Dashboard"
              labelIcon={<Stethoscope size={16} />}
              onClick={() => {
                router.push(clinicDashboardUrl);
              }}
            />
          )}

          {/* Organization Dashboard - single link to first/default organization */}
          {showOrgDashboard && orgDashboardUrl && (
            <UserButton.Action
              label="Organization Dashboard"
              labelIcon={<Building2 size={16} />}
              onClick={() => {
                router.push(orgDashboardUrl);
              }}
            />
          )}

          {/* Dynamic HP Profiles */}
          {hpProfiles && hpProfiles.length > 0 && (
            <UserButton.Action
              label="My Healthcare Profile"
              labelIcon={<Stethoscope size={16} />}
              onClick={() => {
                router.push(`/hp/${hpProfiles[0].id}`);
              }}
            />
          )}

          <UserButton.Action
            label="Account Settings"
            labelIcon={<Settings size={16} />}
            onClick={() => {
              router.push("/settings");
            }}
          />

          <UserButton.Action
            label="Support"
            labelIcon={<LifeBuoy size={16} />}
            onClick={() => {
              router.push("/dashboard/support");
            }}
          />
        </UserButton.MenuItems>
      </UserButton>
    </SignedIn>
  );
}
