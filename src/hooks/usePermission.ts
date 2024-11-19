import { PermissionType } from "@/types"
import { GetPermissions } from "@actions/permission.action"
import { self } from "@services/request"
import useSWR from "swr"

export const usePermissions = ({userId, type}: {userId?: string, type?: PermissionType}) => {
  const fetcher = (args: string) => self.get<GetPermissions>(args)
  const searchParams = new URLSearchParams()
  if(userId) searchParams.set('userId', userId)
  if(type) searchParams.set('type', type)
  return useSWR(`/api/permissions?${searchParams.toString()}`,fetcher)
}