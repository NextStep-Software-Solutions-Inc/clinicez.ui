import { GetUser, GetUsers, GetUsersFilters } from '@actions/users/user.action'
import { self } from '@services/request'
import useSWR from 'swr'


export const useUsers = (filter?: GetUsersFilters) => {
  const fetcher = (args: string) => self.get<GetUsers>(args)
  const searchParams = new URLSearchParams();
  Object.entries(filter || {}).forEach(([key, value]) => {
    if(value) searchParams.append(key, value.toString())
  })
  return  useSWR(() => `/api/users?${searchParams.toString()}`, fetcher);
}
type UseUser = {
  userId?: string,
  email?: string
  orgUid?: string
}
export const useUser = ({userId, email, orgUid}: UseUser) => {
  
  const fetcher = (args: string) => self.get<GetUser>(args)
  const searchParams = new URLSearchParams();
  if (orgUid) searchParams.append("orgUid", orgUid)
  return  useSWR(() => (userId || email) ? `/api/users/${userId || email}?${searchParams.toString()}`: null, fetcher);
}