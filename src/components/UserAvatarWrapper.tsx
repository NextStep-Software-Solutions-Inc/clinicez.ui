
"use client";

import Suspend from "./Suspend";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import { User, Building2, Stethoscope, Settings, LifeBuoy, LayoutDashboard, HeartPulse, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHPs } from "@hooks/useHP";
import { useEffect, useState } from "react";
import { getMyDefaultOrganizationAction } from "@actions/organizations/organization.action";
import { isHP, isOrgMember } from "@lib/org-utils";
import { getDashboardLinksAction, type DashboardLink } from "@actions/dashboard/dashboard-links.action";

const DASHBOARD_ICONS: Record<DashboardLink["type"], React.ReactNode> = {
  patient: <HeartPulse size={16} />,
  tenant: <KeyRound size={16} />,
  clinic: <Stethoscope size={16} />,
  organization: <Building2 size={16} />,
};

export default function UserAvatarWrapper() {
  const { user } = useUser();
  const router = useRouter();
  const [orgDashboardUrl, setOrgDashboardUrl] = useState<string | null>(null);
  const [showOrgDashboard, setShowOrgDashboard] = useState(false);
  const [dashboardLinks, setDashboardLinks] = useState<DashboardLink[]>([]);

  const { data: hpProfiles } = useHPs({ userId: user?.id ?? "" }, !!user?.id);

  // Fetch v2 dashboard links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const links = await getDashboardLinksAction();
        setDashboardLinks(links);
      } catch (error) {
        console.error("Error fetching dashboard links:", error);
      }
    };

    if (user?.id) {
      fetchLinks();
    }
  }, [user?.id]);

  // Determine organization dashboard URL
  useEffect(() => {
    const determineOrgDashboard = async () => {
      try {
        const [hp, member, defaultOrg] = await Promise.all([
          isHP(),
          isOrgMember(),
          getMyDefaultOrganizationAction()
        ]);

        if (hp || member) {
          setShowOrgDashboard(true);
          if (defaultOrg?.data?.Organization.orgUid) {
            setOrgDashboardUrl(`/organizations/${defaultOrg.data.Organization.orgUid}/dashboard`);
          } else {
            setOrgDashboardUrl('/settings/organizations');
          }
        }
      } catch (error) {
        console.error('Error determining org dashboard:', error);
      }
    };

    if (user?.id) {
      determineOrgDashboard();
    }
  }, [user?.id]);

  return (
    <Suspend>
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

            {/* V2 Dashboard Links */}
            {dashboardLinks.map((link) => (
              <UserButton.Action
                key={link.href}
                label={link.label}
                labelIcon={DASHBOARD_ICONS[link.type]}
                onClick={() => {
                  router.push(link.href);
                }}
              />
            ))}

            {/* Dynamic HP Profiles */}
            {hpProfiles?.map((item) => (
              <UserButton.Action
                key={item.id}
                label={`My ${item.HPType.name.replaceAll("_", " ").toLowerCase()} Profile`}
                labelIcon={<Stethoscope size={16} />}
                onClick={() => {
                  router.push(`/hp/${item.id}`);
                }}
              />
            ))}

            <UserButton.Action
              label="Account Settings"
              labelIcon={<Settings size={16} />}
              onClick={() => {
                router.push("/settings");
              }}
            />

            {/* Conditional Organization Dashboard */}
            {showOrgDashboard && orgDashboardUrl && (
              <UserButton.Action
                label="Organization Dashboard"
                labelIcon={<LayoutDashboard size={16} />}
                onClick={() => {
                  router.push(orgDashboardUrl);
                }}
              />
            )}

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
    </Suspend>
  );
}
