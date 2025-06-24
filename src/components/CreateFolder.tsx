"use client"

import { revalidatePath } from '@/actions/cache.action';
import CreateFolderModal from '@/components/files/modals/CreateFolderModal'

function revalidate() {
  revalidatePath("/user/[user]/phr/files/page", "page");
}

export default function CreateFolder() {
  return <CreateFolderModal onCreated={revalidate} />
}
