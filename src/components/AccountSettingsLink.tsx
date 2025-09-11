import { DropdownMenuItem } from "@components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function AccountSettingsLink() {
  return (
    <Link href="/settings">
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" />
        Account Settings
        {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
      </DropdownMenuItem>
    </Link>
  );
}
