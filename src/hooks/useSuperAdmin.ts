"use client";

import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import useSWR from "swr";

const fetcher = async () => {
  return await isSuperAdminAction();
};

export const useSuperAdmin = () => {
  const { data, error, isLoading } = useSWR(
    "super-admin-check",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    isSuperAdmin: data ?? false,
    isLoading,
    error
  };
};
