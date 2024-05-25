import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import React from "react";
import UploadFileModal from "./modals/UploadFileModal";
import Each from "@components/utils/Each";
import File from "./File";

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
            <CardTitle>{folder.name}</CardTitle>
            <CardDescription>{folder.description}</CardDescription>
          </div>
          <div className="ml-auto invisible group-hover/upload:visible transition-all">
            <UploadFileModal folder={folder}/>
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
