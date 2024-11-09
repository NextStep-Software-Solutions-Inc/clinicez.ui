import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import CreateFolderModal from "@components/files/modals/CreateFolderModal";
import Each from "@components/utils/Each";
import Folder from "@components/Folder";
import { getFoldersAction } from "@actions/folder.action";
import { getCachedSession } from "@actions/session.action";
import dayjs from "dayjs";
import Prescriptions from "@components/Prescriptions";
import { Button } from "@components/ui/button";
import { MoreHorizontal, MoreVertical } from "lucide-react";

export const metadata: Metadata = {
  title: "Prescription builder",
  description: "Create and manage prescriptions for your patients"
};

export default async function FilesPage({ params }: AppRouterPageRouteOpts) {
  const organizationId = params?.organization as string;
  const session = await getCachedSession();
  const folders = await getFoldersAction(session?.user.sub, organizationId);
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight flex-1">
              Prescription Builder
            </h2>
            <Button
              size="icon"
              variant="ghost"
              className="font-normal text-base"
            >
              <MoreHorizontal />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Create and manage prescriptions for your patients
          </p>
        </div>
        <Separator />
        <Suspend>
          <Prescriptions />
        </Suspend>
      </div>
    </>
  );
}
