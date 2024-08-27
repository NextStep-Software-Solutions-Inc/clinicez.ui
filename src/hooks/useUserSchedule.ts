"use client";

import { GetUserSchedules } from '@actions/schedule/user-schedule.action';
import { self } from "@services/request";
import useSWR from 'swr';

export const useUserSchedules = (userId: string) => {
  const fetcher = (path: string) => self.get<GetUserSchedules>(path);
  return useSWR(`/api/users/${userId}/schedules`, fetcher)
}