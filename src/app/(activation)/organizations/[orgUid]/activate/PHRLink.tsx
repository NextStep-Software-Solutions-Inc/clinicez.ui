import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import { User } from "lucide-react";
import { getCachedSession } from "@actions/session.action";


export default async function PHRLink() {
  const session = await getCachedSession();
  if (!session) return null;
  return (
    <a href={`/user/${session.user.sub}/phr`}>
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        Personal Health Records
        {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
      </DropdownMenuItem>
    </a>
  );
}
