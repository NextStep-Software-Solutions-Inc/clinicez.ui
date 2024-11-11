import { Organization } from "@prisma/common/client";
import Image from "next/image";
import organizationPlaceholder from "@public/assets/organization_placeholder.jpg";
import Link from "next/link";
import ActionButton from "./ActionButton";

interface OrganizationCardProps {
  organization: Organization
}

export async function OrganizationCard({ organization }: OrganizationCardProps) {
  const {orgId, name, description, picture, customUrl} = organization;

  return (
    <div className="relative group/join hover:scale-105 hover:z-50 transition-all">
      <Link href={customUrl ? customUrl: `/${orgId}`}>
        <div className="overflow-hidden relative h-[15rem] aspect-video rounded-lg shadow-2xl ">
          <Image src={picture ?? organizationPlaceholder} alt={name} fill className="object-scale-down rounded-lg" />
          
        </div>
      </Link>
      <Link href={`/${orgId}/join`} className="invisible group-hover/join:visible transition-all duration-300">
        <div className="rounded-b-lg absolute bottom-0 h-20 w-full bg-white bg-opacity-90 px-4 flex items-center justify-center">
          <p className="mb-2 text-center line-clamp-3 text-sm font-semibold" title={name}>{name}</p>
        </div>
        <ActionButton size="sm" className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">Join</ActionButton>
      </Link>
    </div>
  );
}