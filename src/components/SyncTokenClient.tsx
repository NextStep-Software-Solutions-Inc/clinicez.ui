"use client";

import { useSetAtom } from "jotai";
import { authAtom } from "../state/auth";
import { useEffect } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";

export default function SyncTokenClient() {
  const setAuth = useSetAtom(authAtom);
  const { data: tokenData, error } = useAuthToken();

  useEffect(() => {
    if (tokenData) {
      setAuth(() => ({
        type: tokenData.type,
        token: tokenData.token
      }));
    } else if (error) {
      console.error('Failed to fetch access token:', error);
      setAuth(() => ({ type: "Bearer", token: "" }));
    }
  }, [tokenData, error, setAuth]);

  return null;
}
