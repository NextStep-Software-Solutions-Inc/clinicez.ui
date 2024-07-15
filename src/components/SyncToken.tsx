"use client";

import { useSetAtom } from "jotai";
import { authAtom } from "../state/auth";

interface SyncTokenProps {
  token: {
    type: string;
    accessToken: string;
  }
}

export default function SyncToken({token: {type, accessToken} }:SyncTokenProps) {
  const setAuth = useSetAtom(authAtom)
  setAuth(() => ({type, token: accessToken}))
  return null;
}
