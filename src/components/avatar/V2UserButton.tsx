"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import { Building2, Stethoscope, Settings, LifeBuoy, HeartPulse, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useHPs } from "@hooks/useHP";
import { useEffect, useState } from "react";
import { getDashboardLinksAction, type DashboardLink } from "@actions/dashboard/dashboard-links.action";
import { ClinicOrgSelectorModal } from "@/components/dashboard/clinic-org-selector-modal";

const DASHBOARD_ICONS: Record<DashboardLink["type"], React.ReactNode> = {
  patient: <HeartPulse size={16} />,
  tenant: <KeyRound size={16} />,
  clinic: <Stethoscope size={16} />,
  organization: <Building2 size={16} />,
};

export function V2UserButton() {
  const { user } = useUser();
  const router = useRouter();
  const [dashboardLinks, setDashboardLinks] = useState<DashboardLink[]>([]);
  const [selectorModalType, setSelectorModalType] = useState<"clinic" | "organization" | null>(null);

  const { data: hpProfiles } = useHPs({ userId: user?.id ?? "" }, !!user?.id);

  // Fetch dashboard links and consolidate clinic/org links into selectors (v2 mode)
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        let links = await getDashboardLinksAction();

        // Consolidate individual clinic/org links into selectors
        const hasClinics = links.some((link) => link.type === "clinic");
        const hasOrgs = links.some((link) => link.type === "organization");

        // Remove all clinic links and add a single selector
        if (hasClinics) {
          links = links.filter((link) => link.type !== "clinic");
          links.push({
            label: "My Clinics",
            href: "#clinic-select",
            type: "clinic",
          });
        }

        // Remove all organization links and add a single selector
        if (hasOrgs) {
          links = links.filter((link) => link.type !== "organization");
          links.push({
            label: "My Organizations",
            href: "#org-select",
            type: "organization",
          });
        }

        setDashboardLinks(links);
      } catch (error) {
        console.error("Error fetching dashboard links:", error);
      }
    };

    if (user?.id) {
      fetchLinks();
    }
  }, [user?.id]);

  return (
    <>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10"
            }
          }}
        >
          <UserButton.MenuItems>
            {/* Consolidated Dashboard Links with Modal Selectors (V2 Mode) */}
            {dashboardLinks.map((link) => (
              <UserButton.Action
                key={link.href}
                label={link.label}
                labelIcon={DASHBOARD_ICONS[link.type]}
                onClick={() => {
                  if (link.href === "#clinic-select") {
                    setSelectorModalType("clinic");
                  } else if (link.href === "#org-select") {
                    setSelectorModalType("organization");
                  } else {
                    router.push(link.href);
                  }
                }}
              />
            ))}

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

      {/* Clinic/Organization Selection Modal */}
      <ClinicOrgSelectorModal
        isOpen={selectorModalType !== null}
        onClose={() => setSelectorModalType(null)}
        type={selectorModalType || "clinic"}
      />
    </>
  );
}
