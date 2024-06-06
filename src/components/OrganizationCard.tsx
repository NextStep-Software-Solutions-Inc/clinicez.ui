import { Organization } from "@prisma/client";
import Image from "next/image";
import organizationPlaceholder from "@public/assets/organization_placeholder.jpg";
import Link from "next/link";

interface OrganizationCardProps {
  organization: Organization
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const {orgId, name, description, picture} = organization;
  return (
    <Link href={`/${orgId}`} className=" rounded-lg shadow-md  ">
      <div className="group bg-white overflow-hidden relative rounded-t-lg">
        <Image src={picture ?? organizationPlaceholder} alt={name} width={1000} height={1000} objectFit="cover" className="w-full aspect-video" />
        <div className="absolute inset-0 bg-teal-700 opacity-0 transition duration-300 ease-in-out group-hover:opacity-70 flex items-center justify-center text-white">
          <div>
            <p className="text-sm text-center p-2">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-3 flex items-center justify-center">
        <p className="mb-2 text-center line-clamp-2" title={name}>{name}</p>
      </div>
    </Link>
  );
}