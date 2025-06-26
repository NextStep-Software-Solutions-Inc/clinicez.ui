"use client";

import { revalidatePath } from "@/actions/cache.action";
import FolderSettingSheet from "@/components/FolderSettingSheet";
import { FolderSettingSheetProps } from "@/components/FolderSettingSheet";

function revalidate() {
  revalidatePath("/user/[user]/phr/files/page", "page");
}

interface DeleteFolderProps {
    children?: React.ReactNode;
    record: FolderSettingSheetProps["record"];
}

export default function DeleteFolder({ record, children }: DeleteFolderProps) {
  return <FolderSettingSheet record={ record } onDeleted={revalidate}>
    {children}
  </FolderSettingSheet>;
}