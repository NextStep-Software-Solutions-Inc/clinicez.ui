import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import React from "react";
import Each from "@components/utils/Each";
import File, { FileProps } from "./File";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic"
import { FolderIcon, MoreVertical } from "lucide-react";
import ConditionalRender from "./utils/ConditionalRender";
import FolderSettingSheet from "./FolderSettingSheet";
import { Button } from "./ui/button";
import UpdateFolderModal from "../app/(process)/[organization]/files/components/modals/UpdateFolderModal";

const UploadFileModal = dynamic(() => import("../app/(process)/[organization]/files/components/modals/UploadFileModal"));

export interface FolderProps {
  readOnly?: boolean;
  folder: {
    id: number;
    name: string;
    isPublic?: boolean;
    description?: string;
    files: FileProps["file"][];
  };
}


export default async function Folder({folder, readOnly}: FolderProps) {
  
  return (
    <Card>
      <CardHeader className="group/upload">
        <div className="flex flex-row">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg "><FolderIcon className="text-primary"/>{folder.name} 
              <ConditionalRender condition={!readOnly}>
                <UpdateFolderModal folderId={folder.id} folderName={folder.name}/>
              </ConditionalRender>
            </CardTitle>
            <CardDescription>{folder?.description}</CardDescription>
          </div>
          <div className="ml-auto group-hover/upload:visible transition-all">
            <Suspend>
              <ConditionalRender condition={!readOnly}>
                <div className="flex items-center gap-2">
                  <UploadFileModal folder={folder}/>
                  <FolderSettingSheet record={{
                    id: folder.id,
                    subject: folder.name,
                    settings: {
                      isPublic: folder.isPublic ?? false
                    }
                  }} >
                    <Button size="icon" variant="ghost"><MoreVertical/></Button>
                  </FolderSettingSheet>
                </div>
              </ConditionalRender>
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1">
        <Each
          of={folder.files}
          render={file => <File readOnly={readOnly} file={file} />}
        />
      </CardContent>
    </Card>
  );
}
