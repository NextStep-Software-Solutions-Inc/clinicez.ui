
"use client";

import Suspend from "./Suspend";
import { useUser } from "@clerk/nextjs";
import { useLandingPageVersion } from "./VersionSwitcher";
import { ClassicUserButton } from "./avatar/ClassicUserButton";
import { V2UserButton } from "./avatar/V2UserButton";

export default function UserAvatarWrapper() {
  const { user } = useUser();
  const version = useLandingPageVersion();

  // Only render when user is loaded
  if (!user?.id) return null;

  return (
    <Suspend>
      {version === "v1" ? <ClassicUserButton /> : <V2UserButton />}
    </Suspend>
  );
}
