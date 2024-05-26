import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import React from "react";
import Each from "@components/utils/Each";
import File from "./File";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic"
import { FolderIcon } from "lucide-react";

const UploadFileModal = dynamic(() => import("./modals/UploadFileModal"));

interface FolderProps {
  folder: {
    id: string;
    name: string;
    description: string;
    files: {
      id: string;
      name: string;
      description: string;
      type: string;
      url: string;
      date: Date;
    }[];
  };
}


export default async function Folder({folder}: FolderProps) {
  return (
    <Card>
      <CardHeader className="group/upload">
        <div className="flex flex-row">
          <div>
            <CardTitle className="flex items-center gap-2"><FolderIcon/>{folder.name}</CardTitle>
            <CardDescription>{folder.description}</CardDescription>
          </div>
          <div className="ml-auto invisible group-hover/upload:visible transition-all">
            <Suspend>
              <UploadFileModal folder={folder}/>
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1">
        <Each
          of={folder.files}
          render={file => <File file={file} />}
        />
      </CardContent>
    </Card>
  );
}
