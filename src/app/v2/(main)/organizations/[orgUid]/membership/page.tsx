import { notFound } from "next/navigation";
import { getMyOrgMembershipAction } from "@/actions/organizations/org-member.action";
import MyMembershipClient from "@/components/v2/org/MyMembershipClient";
import HeroBackground from "@/components/HeroBackground";
import HeaderTitle from "@/components/HeaderTitle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface MembershipPageProps {
  params: Promise<{ orgUid: string }>;
}

export default async function MembershipPage({ params }: MembershipPageProps) {
  const { orgUid } = await params;

  const result = await getMyOrgMembershipAction(orgUid);
  const membership = result.data;

  if (!membership) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 max-w-3xl space-y-6">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.1} />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/v2/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <HeaderTitle
            header={[
              { text: membership.Organization.name, className: "text-primary" },
            ]}
            description="View and manage your submitted membership requirements."
            className="text-left"
          />
        </div>
      </div>

      <MyMembershipClient membership={membership} orgUid={orgUid} />
    </div>
  );
}
