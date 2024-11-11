"use client";

import { useSetAtom } from "jotai";
import { authAtom } from "../state/auth";
import { useEffect } from "react";

interface SyncTokenProps {
  token: {
    type: string;
    accessToken: string;
  }
}

export default function SyncToken({token: {type, accessToken} }:SyncTokenProps) {
  const setAuth = useSetAtom(authAtom)
  
  useEffect(() => {
    setAuth(() => ({type, token: accessToken}))
  }, [accessToken, setAuth, type])
  
  return null;
}
