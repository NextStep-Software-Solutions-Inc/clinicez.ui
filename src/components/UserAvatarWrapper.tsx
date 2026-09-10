"use client";

import Suspend from "./Suspend";
import { useUser } from "@clerk/nextjs";
import { V2UserButton } from "./avatar/V2UserButton";

export default function UserAvatarWrapper() {
  const { user } = useUser();

  // Only render when user is loaded
  if (!user?.id) return null;

  return (
    <Suspend>
      <V2UserButton />
    </Suspend>
  );
}
